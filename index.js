import { JiraApi } from 'jira';
import config from './config';
import Promise from 'bluebird';

const echo = console.log;

const { username, password } = config;
const scheme = 'https';
const host = 'cbinsights.atlassian.net';
const port = 443;
const apiVersion = '2';
const debug = true;
const jira = new JiraApi(
  scheme,
  host,
  port,
  username,
  password,
  apiVersion,
  debug
);

Promise.promisifyAll(jira, { suffix: 'Async' });

const filterCompletedIssues = issues =>
  issues.filter(i => i.fields.status.id !== '10001');

export const getTickets = () =>
  jira
    .getCurrentUserAsync()
    .then(({ name }) => jira.getUsersIssuesAsync(name, false))
    .then(({ issues }) =>
      Promise.all(issues.map(i => jira.findIssueAsync(i.key)))
    )
    .then(filterCompletedIssues)
    .then(issuesInfo => issuesInfo.forEach(echo));
