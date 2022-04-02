const express = require("express");
const ExpressError = require("../expressError");
const db = require("../db");

let router = new express.Router();

router.get("/", async (req, res, next) => {
  try {
    const industryResults = await db.query(
      `SELECT code, name
                  FROM industries`
    );
    const compResult = await db.query(
      `SELECT c.code
            FROM industries i
            JOIN companies_industries ci
            ON i.code = ci.ind_code
            JOIN companies c
            ON ci.comp_code = c.code`
    );
    return res.json({
      industries: industryResults.rows,
      companies: compResult.rows,
    });
  } catch (err) {
    return next(err);
  }
});
