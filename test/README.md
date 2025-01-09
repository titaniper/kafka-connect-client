# version
npm view @jykang/performancejs versions; npm i; npm run dev;

docker run -p 9113:9113 -p 8081:8081 \
  -e KAFKA_CONNECT_HOST=http://host.docker.internal:8083 \
  -e PORT=8081 -e PROMETHEUS_MONITORING_PORT=9113 \