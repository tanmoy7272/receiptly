export const getHealthStatus = () => {
  return {
    status: 'ok',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  };
};
