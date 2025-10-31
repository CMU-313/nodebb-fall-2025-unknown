/*
 * From https://grafana.com/docs/k6/latest/get-started/write-your-first-test/
*/
import http from 'k6/http';
import { check, sleep } from 'k6';

// 100 iterations of test within function (), shared across 10 VUs (virtual users)
export const options = {
    vus : 10,
    duration : '30s',
    iterations : 100,
};

// The default exported function is gonna be picked up by k6 as the entry point for the test script. It will be executed repeatedly in "iterations" for the whole duration of the test.
export default function () {
  // Make a GET request to the target URL
  const res = http.get('http://128.2.220.229:4567/');
  check(res, { 'status was 200': (r) => r.status == 200 });
  // Sleep for 1 second to simulate real-world usage
  sleep(1);
}
