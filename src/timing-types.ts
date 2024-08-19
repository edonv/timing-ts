import type { operations } from './openapi/schema.js';

type _QueryParams<K extends keyof operations> = operations[K]['parameters']['query'];
type _PathParams<K extends keyof operations> = operations[K]['parameters']['path'];
type _ReqBody<K extends keyof operations> = NonNullable<operations[K]['requestBody']>['content']['application/json'];

interface HasJSONContent {
    content: {
        'application/json': any,
    },
}
type _Response<K extends keyof operations, R extends keyof operations[K]['responses']> = operations[K]['responses'][R] extends HasJSONContent
    ? operations[K]['responses'][R]['content']['application/json']
    : operations[K]['responses'][R];

export namespace TimingTypes {
    export namespace Projects {
        export namespace HierarchicalList {
            export type Params = _QueryParams<'listProjectsHierarchically'>;
            export type Response = _Response<'listProjectsHierarchically', 200>['data'];
        }

        export namespace List {
            export type Params = Omit<_QueryParams<'listProjects'>, 'hide_archived'> & {
                /**
                 * @description If set to `true`, archived projects and their children will not be included in the result.
                 * @example true
                 */
                hide_archived?: true,
            };
            export type Response = _Response<'listProjects', 200>['data'];
        }

        export namespace Create {
            export type RequestBody = _ReqBody<'createProject'>;
            export type Response = _Response<'createProject', 201>['data'];
            export type LinkedTimeEntriesParams = TimeEntries.List.Params;
        }

        export namespace Show {
            export type PathParam = _PathParams<'showProject'>['project_id'];
            export type Response = _Response<'showProject', 200>['data'];
        }

        export namespace Update {
            export type PathParam = _PathParams<'updateProject'>['project_id'];
            export type RequestBody = _ReqBody<'updateProject'>;
            export type Response = _Response<'updateProject', 200>['data'];
        }

        export namespace Delete {
            export type PathParam = _PathParams<'deleteProject'>['project_id'];
            // export type Response = _Response<'deleteProject'>['204']['data'];
        }
    }

    export namespace Reports {
        export namespace Generate {
            export type Params = _QueryParams<'generateReport'>;
            export type Response = _Response<'generateReport', 200>['data'];
        }
    }

    export namespace Teams {
        export namespace Members {
            export type PathParam = _PathParams<'listTeamMembers'>['team_id'];
            export type Response = _Response<'listTeamMembers', 200>['data'];
        }

        export namespace List {
            export type Response = _Response<'listTeams', 200>['data'];
        }
    }

    export namespace TimeEntries {
        export namespace Start {
            export type RequestBody = _ReqBody<'startTimer'>;
            export type Response = _Response<'startTimer', 201>['data'];
        }

        export namespace Stop {
            export type Response = _Response<'stopTimer', 200>['data'];
        }

        export namespace ShowLatest {
            // export type Response = _Response<'showLatestTimeEntry', 302>['content']['text/plain'];
            export type Response = Show.PathParam;
        }

        export namespace ShowRunning {
            export type Response = SuccessResponse | ErrorResponse;
            type ErrorResponse = _Response<'showRunningTimer', 404>;
            // 200
            type SuccessResponse = _Response<'showTimeEntry', 200>['data'];
            // interface SuccessfulResponse {
            //     "data": {
            //         self: "/time-entries/3694122002305638144",
            //         start_date: "2024-07-05T20:00:05.000000+00:00",
            //         end_date: "2024-07-05T20:00:19.000000+00:00",
            //         duration: 14,
            //         project: {
            //             "self": "/projects/3618024099524456192"
            //         },
            //         title: null,
            //         notes: null,
            //         is_running: true,
            //         creator_name: "edon@valdman.works",
            //         custom_fields: {}
            //     }
            // }
        }

        export namespace List {
            export type Params = _QueryParams<'listTimeEntries'>;
            export type Response = _Response<'listTimeEntries', 200>;
        }

        export namespace Create {
            export type Body = _ReqBody<'createTimeEntry'>;
            export type Response = _Response<'createTimeEntry', 201>['data'];
        }

        export namespace Show {
            export type PathParam = _PathParams<'showTimeEntry'>['activity_id'];
            export type Response = _Response<'showTimeEntry', 200>['data'];
        }

        export namespace Update {
            export type PathParam = _PathParams<'updateTimeEntry'>['activity_id'];
            export type Body = _ReqBody<'updateTimeEntry'>;
            export type Response = _Response<'updateTimeEntry', 200>['data'];
        }

        export namespace Delete {
            export type PathParam = _PathParams<'deleteTimeEntry'>['activity_id'];
        }
    }
}