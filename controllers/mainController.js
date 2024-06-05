/** @format */

"use strict";

module.exports = {
  main: async (req, res) => {
    res.render("main", {
        layout: "layouts/main-layouts",
        message: "ok",
        title: "Home",
  })
}};