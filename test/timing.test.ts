import 'dotenv/config';
import { paths } from '../src/openapi/schema.js';
import { describe, expect, test } from '@jest/globals';

import { DateTime } from 'luxon';

import Timing from '../src/timing.js';

function client(): Timing {
    return new Timing({
        apiKey: process.env.TIMING_TEST_API_KEY,
    });
}

/*
To-Dos:
- [ ] once project[] vs projects[] is fixed, make sure `createProject()` works right with it, then replicate the return types for `showProject()`
*/

/* Notes for dev:
- Create project
    - parent parameter field can be a string or an string[], not just a string
- List time entries
    - using `project[]` (as in `links` from other requests) works, but using `projects[]` as in spec has no effect
*/

// const stri1  = '2024-07-01T17:33:47.343-05:00+00:00';
// const string = '2024-07-01T22:33:47.343117+00:00'
//     .replace(/(\d{4}\-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3})(\d{3})(\+\d{2}:\d{2})?/, '$1$3');
// const date = DateTime.fromISO(
//     string, 
//     // `yyyy-MM-dd'T'HH:mm:ss.SSSSSSZZ`,
// );
// console.log(date.toJSON());


try {
    const timing = client();
    const projects = await timing.listProjects();
    if (projects[0].self) {
        const { entriesParams } = await timing.createProject({ title: "Test New 2" });
        const entries = await timing.listTimeEntries(entriesParams);
        console.log(entries);
    }
} catch (error) {
    console.error('Error:', error);
}

// describe('Timing', () => {
//     test('listProjects', async () => {
//         // expect(sum(1, 2)).toBe(3);
        
//     });
// });
