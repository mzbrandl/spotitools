const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function (app) {
  const target = process.env.PROXY_TARGET || 'http://localhost:3001';

  app.use(
    ['/login', '/callback', '/refresh_token', '/subscribe_monthly_export', '/unsubscribe_monthly_export', '/monthly_export'],
    createProxyMiddleware({ target })
  );
};
