import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate } from 'k6/metrics';

export const getContactsDuration = new Trend('get_contacts_duration', true);
export const getContactsSuccessRate = new Rate('get_contacts_success_rate');

export const options = {
  thresholds: {
    http_req_failed: ['rate<0.12'], // Menos de 12% das requisições retornando erro
    http_req_duration: ['p(95)<5700'] // 95% das respostas com tempo abaixo de 5700ms
  },
  stages: [
    { duration: '1m', target: 10 },
    { duration: '1m', target: 82 },
    { duration: '1m', target: 155 },
    { duration: '1m', target: 225 },
    { duration: '1m', target: 300 }
  ]
};

export function handleSummary(data) {
  return {
    './src/output/index.html': htmlReport(data),
    stdout: textSummary(data, { indent: ' ', enableColors: true })
  };
}

export default function () {
  const endpoint = 'https://deckofcardsapi.com/api/deck/new/shuffle/?deck_count=1';

  const params = {
    headers: {
      'Content-Type': 'application/json'
    }
  };

  const OK = 200;

  const res = http.get(`${endpoint}`, params);

  getContactsDuration.add(res.timings.duration);
  getContactsSuccessRate.add(res.status === OK);

  check(res, {
    'get contacts - status 200': () => res.status === OK
  });

  sleep(1);
}