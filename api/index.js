module.exports = async function (req, res) {
  const { handle } = await import('../server/http/handler.mjs');
  return handle(req, res);
};
