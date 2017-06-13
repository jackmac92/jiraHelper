'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var jira = require('jira');
var Promise = _interopDefault(require('bluebird'));

const echo = console.log;

const username = process.env.JIRA_USERNAME;
const password = process.env.JIRA_PASSWORD;

const scheme = 'https';
const host = 'cbinsights.atlassian.net';
const port = 443;
const apiVersion = '2';
const debug = true;
const jira$1 = new jira.JiraApi(
  scheme,
  host,
  port,
  username,
  password,
  apiVersion,
  debug
);

Promise.promisifyAll(jira$1, { suffix: 'Async' });

const filterCompletedIssues = issues =>
  issues.filter(i => i.fields.status.id !== '10001');

const getTickets = () =>
  jira$1
    .getCurrentUserAsync()
    .then(({ name }) => jira$1.getUsersIssuesAsync(name, false))
    .then(({ issues }) =>
      Promise.all(issues.map(i => jira$1.findIssueAsync(i.key)))
    )
    .then(filterCompletedIssues)
    .then(issuesInfo => issuesInfo.forEach(echo));

require.main === module && getTickets();

exports.getTickets = getTickets;
