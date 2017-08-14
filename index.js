import { JiraApi } from 'jira';
import bluebird from 'bluebird';
import Fetcher from 'localApi';

global.Promise = bluebird;

const echo = console.log;

const username = process.env.JIRA_USERNAME;
const password = process.env.JIRA_PASSWORD;

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

bluebird.promisifyAll(jira, { suffix: 'Async' });

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
const formatTickets = tickets => tickets.map(formatTicket);

const fetcher = new Fetcher({
  doRequest: key => jira.findIssueAsync(key).then(tryfromat),
  getKey: key => `${key}`,
  storage: './cache'
});

const getIssueDetails = ({ key }) => fetcher.get(key);

export const getTickets = () =>
  jira
    .getCurrentUserAsync()
    .then(({ name }) => jira.getUsersIssuesAsync(name, false))
    .then(({ issues }) => Promise.all(issues.map(getIssueDetails)));

export const getIncompleteTickets = () =>
  getTickets().then(filterCompletedIssues);

export const getTodoList = () => getIncompleteTickets().then(filterBacklog);

require.main === module &&
  getTickets().then(issuesInfo => issuesInfo.forEach(echo));
