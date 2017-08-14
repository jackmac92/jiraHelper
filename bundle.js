'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var jira = require('jira');
var bluebird = _interopDefault(require('bluebird'));
var Fetcher = _interopDefault(require('localApi'));

global.Promise = bluebird;

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

bluebird.promisifyAll(jira$1, { suffix: 'Async' });

const issueIsCompleted = issue => issue.status.id !== '10001';
const issueIsInCurrentSprint = issue => false;

const filterCompletedIssues = issues => issues.filter(issueIsCompleted);
const filterBacklog = issues => issues.filter(issueIsInCurrentSprint);

const formatTicket = ({ key, fields }) => ({
  key,
  desc: fields.description,
  status: fields.status,
  summary: fields.summary
});
const tryfromat = thing => {
  try {
    return formatTicket(thing);
  } catch (e) {
    return {};
  }
};
const fetcher = new Fetcher({
  doRequest: key => jira$1.findIssueAsync(key).then(tryfromat),
  getKey: key => `${key}`,
  storage: './cache'
});

const getIssueDetails = ({ key }) => fetcher.get(key);

const getTickets = () =>
  jira$1
    .getCurrentUserAsync()
    .then(({ name }) => jira$1.getUsersIssuesAsync(name, false))
    .then(({ issues }) => Promise.all(issues.map(getIssueDetails)));

const getIncompleteTickets = () =>
  getTickets().then(filterCompletedIssues);

const getTodoList = () => getIncompleteTickets().then(filterBacklog);

require.main === module &&
  getTickets().then(issuesInfo => issuesInfo.forEach(echo));

exports.getTickets = getTickets;
exports.getIncompleteTickets = getIncompleteTickets;
exports.getTodoList = getTodoList;
