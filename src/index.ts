import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

export interface ConnectorConfig {
    name: string;
    config: {
      "connector.class": string;
      [key: string]: any;
    };
  }
  
  export interface ConnectorInfo {
    name: string;
    config: Record<string, any>;
    tasks: Task[];
    type: string;
  }
  
  export interface Task {
    connector: string;
    task: number;
  }
  
  export interface ConnectorStatus {
    name: string;
    connector: {
      state: string;
      worker_id: string;
    };
    tasks: TaskStatus[];
  }
  
  export interface TaskStatus {
    id: number;
    state: string;
    worker_id: string;
    trace?: string;
  }
  
  export class KafkaConnectClient {
    private client: AxiosInstance;
  
    constructor(baseURL: string, config?: AxiosRequestConfig) {
      this.client = axios.create({
        baseURL,
        ...config,
      });
    }
  
    // Connectors
    async listConnectors(): Promise<string[]> {
      const response = await this.client.get('/connectors');
      return response.data;
    }
  
    async getConnectorInfo(name: string): Promise<ConnectorInfo> {
      const response = await this.client.get(`/connectors/${name}`);
      return response.data;
    }
  
    async getConnectorConfig(name: string): Promise<Record<string, any>> {
      const response = await this.client.get(`/connectors/${name}/config`);
      return response.data;
    }
  
    async getConnectorStatus(name: string): Promise<ConnectorStatus> {
      const response = await this.client.get(`/connectors/${name}/status`);
      return response.data;
    }
  
    async createConnector(config: ConnectorConfig): Promise<ConnectorInfo> {
      const response = await this.client.post('/connectors', config);
      return response.data;
    }
  
    async updateConnectorConfig(name: string, config: Record<string, any>): Promise<ConnectorInfo> {
      const response = await this.client.put(`/connectors/${name}/config`, config);
      return response.data;
    }
  
    async deleteConnector(name: string): Promise<void> {
      await this.client.delete(`/connectors/${name}`);
    }
  
    async pauseConnector(name: string): Promise<void> {
      await this.client.put(`/connectors/${name}/pause`);
    }
  
    async resumeConnector(name: string): Promise<void> {
      await this.client.put(`/connectors/${name}/resume`);
    }
  
    async restartConnector(name: string): Promise<void> {
      await this.client.post(`/connectors/${name}/restart`);
    }
  
    async restartTask(connectorName: string, taskId: number): Promise<void> {
      await this.client.post(`/connectors/${connectorName}/tasks/${taskId}/restart`);
    }
  
    // Connector Plugins
    async listConnectorPlugins(): Promise<any[]> {
      const response = await this.client.get('/connector-plugins');
      return response.data;
    }
  
    async validateConnectorConfig(plugin: string, config: Record<string, any>): Promise<any> {
      const response = await this.client.put(`/connector-plugins/${plugin}/config/validate`, config);
      return response.data;
    }
  
    // Error handling helper
    private handleError(error: any): never {
      if (error.response) {
        throw new Error(`Kafka Connect API Error: ${error.response.status} - ${error.response.data}`);
      }
      throw error;
    }
  }