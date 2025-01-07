import { KafkaConnectClient } from '@jykang/kafka-connect-client';
import * as prometheus from 'prom-client';
import express from 'express';


// Prometheus 메트릭 정의
const connectorsRunning = new prometheus.Gauge({
  name: 'kafka_connect_connector_state_running',
  help: 'is the connector running?',
  labelNames: ['connector', 'state', 'worker']
});

const tasksState = new prometheus.Gauge({
  name: 'kafka_connect_connector_tasks_state',
  help: 'the state of tasks. 0-failed, 1-running, 2-unassigned, 3-paused',
  labelNames: ['connector', 'state', 'worker_id', 'id']
});

const connectUp = new prometheus.Gauge({
  name: 'kafka_connect_up',
  help: 'was the last scrape of kafka connect successful?'
});

const connectorsCount = new prometheus.Gauge({
  name: 'kafka_connect_connectors_count',
  help: 'number of deployed connectors'
});

// const client = new KafkaConnectClient('http://localhost:60583');
const client = new KafkaConnectClient('http://localhost:8083');

async function collectMetrics() {
  try {
    // 초기화
    connectUp.set(0);
    
    // 커넥터 목록 조회
    const connectors = await client.listConnectors();
    
    // 기본 메트릭 설정
    connectUp.set(1);
    connectorsCount.set(connectors.length);

    // 각 커넥터의 상태 조회
    const statuses = await Promise.all(
      connectors.map(connector => client.getConnectorStatus(connector))
    );

    // 커넥터 상태 메트릭 설정
    statuses.forEach(status => {
      const isRunning = status.connector.state.toLowerCase() === 'running' ? 1 : 0;
      
      connectorsRunning.labels(
        status.name,
        status.connector.state.toLowerCase(),
        status.connector.worker_id
      ).set(isRunning);

      // 태스크 상태 메트릭 설정
      status.tasks.forEach(task => {
        let state: number;
        switch (task.state.toLowerCase()) {
          case 'running':
            state = 1;
            break;
          case 'unassigned':
            state = 2;
            break;
          case 'paused':
            state = 3;
            break;
          default:
            state = 0;
        }

        tasksState.labels(
          status.name,
          task.state.toLowerCase(),
          task.worker_id,
          task.id.toString()
        ).set(state);
      });
    });

  } catch (error) {
    console.error('Error collecting metrics:', error);
    connectUp.set(0);
  }
}

(() => {
  // HTTP 서버 설정
  const app = express();

  // 메트릭 엔드포인트
  app.get('/metrics', async (req: any, res: any) => {
    try {
      await collectMetrics();
      res.set('Content-Type', prometheus.register.contentType);
      res.end(await prometheus.register.metrics());
    } catch (error) {
      res.status(500).end(error);
    }
  });

  // 기본 리다이렉트
  app.get('/', (req: any, res: any) => {
    res.redirect('/metrics');
  });

  // 서버 시작
  const PORT = 8080;
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
})();