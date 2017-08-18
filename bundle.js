'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var jira = require('jira');
var bluebird = _interopDefault(require('bluebird'));
var Fetcher = _interopDefault(require('localApi'));

global.Promise = bluebird;

const username = process.env.JIRA_USERNAME;
const password = process.env.JIRA_PASSWORD;

const scheme = 'https';
const host = 'cbinsights.atlassian.net';
const port = 443;
const apiVersion = '2';
const debug = true;

const issueIsCompleted = issue => issue.status.id !== '10001';
const filterCompletedIssues = issues => issues.filter(issueIsCompleted);
const formatTicket = ({ key, fields }) => ({
  key,
  desc: fields.description,
  status: fields.status,
  summary: fields.summary
});
const tryformat = thing => {
  try {
    return formatTicket(thing);
  } catch (e) {
    return {};
  }
};

// const formatTickets = tickets => tickets.map(formatTicket);

// const getIssueDetails = ({ key }) => fetcher.get(key);

// export const getTickets = () =>
//   jira
//     .getCurrentUserAsync()
//     .then(({ name }) => jira.getUsersIssuesAsync(name, false))
//     .then(({ issues }) => Promise.all(issues.map(getIssueDetails)));

// export const getIncompleteTickets = () =>
//   getTickets().then(filterCompletedIssues);

// export const getTodoList = () => getIncompleteTickets().then(filterBacklog);

class JiraFetcher {
  constructor({ dir, username, password }) {
    this.jiraApi = new jira.JiraApi(
      scheme,
      host,
      port,
      username,
      password,
      apiVersion,
      debug
    );
    bluebird.promisifyAll(this.jiraApi, { suffix: 'Async' });
    const ticketFetcher = new Fetcher({
      doRequest: key => this.jiraApi.findIssueAsync(key).then(tryformat),
      getKey: key => `${key}`,
      storage: dir
    });
    this.getTicket = ({ key }) => ticketFetcher.get(key);
    this.getAll = this.getAll.bind(this);
    this.getToDos = this.getToDos.bind(this);
  }

  getAll() {
    return this.jiraApi
      .getCurrentUserAsync()
      .then(({ name }) => this.jiraApi.getUsersIssuesAsync(name, false))
      .then(({ issues }) => Promise.all(issues.map(this.getTicket)));
  }
  getToDos() {
    return this.getAll().then(filterCompletedIssues);
  }
}

// require.main === module &&
//   getIncompleteTickets().then(issuesInfo => issuesInfo.forEach(echo)) &&
//   getIncompleteTickets().then(issuesInfo => echo(issuesInfo.length)) &&
//   getTodoList().then(issuesInfo => echo(issuesInfo.length));

const j = new JiraFetcher({ dir: './cache', username, password });
j.getToDos().then(console.log);

module.exports = JiraFetcher;
