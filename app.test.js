'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { sites, alerts, periods, filterSites, chartMarkup, reportCsv } = require('./app.js');

test('demo fleet has six unique sites and consistent health counts', () => {
  assert.equal(sites.length, 6);
  assert.equal(new Set(sites.map(site => site.id)).size, 6);
  assert.equal(filterSites('', 'healthy').length, 4);
  assert.equal(filterSites('', 'warning').length, 1);
  assert.equal(filterSites('', 'critical').length, 1);
});
test('search supports names, locations, IDs, case and whitespace', () => {
  assert.equal(filterSites(' TEHRAN ', 'all')[0].id, 'THR-01');
  assert.equal(filterSites('datacenter', 'all').length, 2);
  assert.equal(filterSites('mhd-04', 'critical').length, 1);
  assert.equal(filterSites('Tehran', 'critical').length, 0);
  assert.equal(filterSites('<script>', 'all').length, 0);
  assert.equal(filterSites('', 'all').length, 6);
});
test('each chart period produces finite SVG geometry and distinct data', () => {
  const charts = Object.keys(periods).map(period => {
    const svg = chartMarkup(period);
    assert.match(svg, /^<svg/);
    assert.doesNotMatch(svg, /NaN|undefined|Infinity/);
    for (const label of periods[period].labels) assert.ok(svg.includes(label));
    return svg;
  });
  assert.equal(new Set(charts).size, 3);
});
test('export labels demo data and includes all site measurements', () => {
  const csv = reportCsv();
  assert.match(csv, /SIMULATED DEMO DATA/);
  assert.equal(csv.split('\r\n').length, 8);
  for (const site of sites) assert.ok(csv.includes(site.id));
});
test('alerts refer to fleet sites and have one critical event', () => {
  assert.equal(alerts.filter(alert => alert.status === 'critical').length, 1);
  for (const alert of alerts) assert.ok(sites.some(site => site.name === alert.site));
});
test('document has unique IDs and matching application selectors', () => {
  const html = readFileSync(`${__dirname}/index.html`, 'utf8');
  const app = readFileSync(`${__dirname}/app.js`, 'utf8');
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
  assert.equal(new Set(ids).size, ids.length);
  for (const match of app.matchAll(/\$\('#([\w-]+)'\)/g)) assert.ok(ids.includes(match[1]), `Missing #${match[1]}`);
  assert.match(html, /<html lang="en">/);
  assert.match(html, /aria-live="polite"/);
  assert.match(html, /<dialog/);
  assert.match(html, /All sites, measurements and alerts are simulated/);
});
