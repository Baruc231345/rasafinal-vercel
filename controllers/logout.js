const logout = (req, res) => {
    res.clearCookie("userRegistered");
    req.session.universalId = null;
    res.redirect("/");
  };
  
  module.exports = logout;