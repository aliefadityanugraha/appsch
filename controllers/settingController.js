"use strcit";

module.exports = {
  settings: (req, res) => {
    res.render("settings", {
      layout: "layouts/main-layouts",
      title: "Setiings",
      req: req.path,
    });
  },
};
