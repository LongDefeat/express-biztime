const express = require("express");
const slugify = require("slugify");
const ExpressError = require("../expressError");
const db = require("../db");

let router = new express.Router();

router.get("/", async function (req, res, next) {
  try {
    const result = await db.query(
      `SELECT code, name 
           FROM companies 
           ORDER BY name`
    );

    return res.json({ companies: result.rows });
  } catch (err) {
    return next(err);
  }
});

router.get("/:code", async function (req, res, next) {
  try {
    let code = req.params.code;

    const compResult = await db.query(
      `SELECT code, name, description
           FROM companies
           WHERE code = $1`,
      [code]
    );

    const invResult = await db.query(
      `SELECT id
           FROM invoices
           WHERE comp_code = $1`,
      [code]
    );

    const industryResults = await db.query(
      `SELECT i.name
      FROM comapnies c
      JOIN companies_industries ci
      ON c.code = ci.comp_code
      JOIN industries i
      ON ci.ind_code = i.code
      WHERE c.code=$1`,
      [code]
    );

    if (compResult.rows.length === 0) {
      throw new ExpressError(`No such company: ${code}`, 404);
    }

    const company = compResult.rows[0];
    const invoices = invResult.rows;
    const industries = industryResults.rows;

    company.invoices = invoices.map((inv) => inv.id);
    company.industries = industries.map((ind) => ind.id);

    return res.json({
      company: company,
      invoices: invoices.rows,
      industries: industryResults.rows,
    });
  } catch (err) {
    return next(err);
  }
});

router.post("/", async function (req, res, next) {
  try {
    let { name, description } = req.body;
    let code = slugify(name, { lower: true });

    const result = await db.query(
      `INSERT INTO companies (code, name, description) 
           VALUES ($1, $2, $3) 
           RETURNING code, name, description`,
      [code, name, description]
    );

    return res.status(201).json({ company: result.rows[0] });
  } catch (err) {
    return next(err);
  }
});

router.put("/:code", async function (req, res, next) {
  try {
    let { name, description } = req.body;
    let code = req.params.code;

    const result = await db.query(
      `UPDATE companies
           SET name=$1, description=$2
           WHERE code = $3
           RETURNING code, name, description`,
      [name, description, code]
    );

    if (result.rows.length === 0) {
      throw new ExpressError(`No such company: ${code}`, 404);
    } else {
      return res.json({ company: result.rows[0] });
    }
  } catch (err) {
    return next(err);
  }
});

router.delete("/:code", async function (req, res, next) {
  try {
    let code = req.params.code;

    const result = await db.query(
      `DELETE FROM companies
           WHERE code=$1
           RETURNING code`,
      [code]
    );

    if (result.rows.length == 0) {
      throw new ExpressError(`No such company: ${code}`, 404);
    } else {
      return res.json({ status: "deleted" });
    }
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
