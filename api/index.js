module.exports = async function (req, res) {
  const {handle} = await import('../server/http.mjs');
  return handle(req, res);
};
