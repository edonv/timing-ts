import createClient, { type Middleware } from 'openapi-fetch';
import { paths } from './openapi/schema.js';

import { TimingTypes } from './timing-types.js';

interface TimingOptions {
    apiKey: string;
    // requestTimeout?: number;
}

export class TimingError extends Error {
    readonly status: number;
    readonly body: unknown;

    constructor(message: string, status: number, body: unknown) {
        super(message);
        this.name = 'TimingError';
        this.status = status;
        this.body = body
    }
}

export default class Timing {
    private static readonly _baseUrl = 'https://web.timingapp.com';

    private _client: ReturnType<typeof createClient<paths>>;

    constructor(opts: TimingOptions) {
        this._client = createClient<paths>({
            baseUrl: Timing._baseUrl,
            // x-ratelimit-remaining extra header?
        });

        const authMiddleware: Middleware = {
            async onRequest({ request }) {
                // add Authorization header to every request
                request.headers.set("Authorization", `Bearer ${opts.apiKey}`);
                return request;
            },
            async onResponse({ response }) {
                // If not OK, throw error.
                if (!response.ok) {
                    // If response is "Unauthorized", set the message specifically.
                    const message = response.status == 401 ? 'Request not authorized.' : 'Request unsuccessful.';
                    throw new TimingError(
                        message,
                        response.status,
                        await response.json(),
                    );
                }
            }
        };

        this._client.use(authMiddleware);
    }

    /**
     * Converts an entry reference to a raw ID for plugging into other API calls.
     * @example "/time-entries/3694122002305638144" -> "3694122002305638144"
     * @param reference Entity reference string or ID returned by the API with a field named `self`. For example: `/time-entries/3694122002305638144`.
     */
    static entryIDFromReference(reference: string | number): string {
        // Just in case it's already split/stripped, it gets the last element
        return reference.toString()
            .split('/')
            .at(-1);
    }

    // MARK: Projects

    /**
     * List projects hierarchically.
     * @description Return the complete project hierarchy.
     */
    async listProjectsHierarchically(
        query: TimingTypes.Projects.HierarchicalList.Params = {},
    ): Promise<TimingTypes.Projects.HierarchicalList.Response> {
        const { data } = await this._client.GET('/api/v1/projects/hierarchy', {
            params: {
                query: query,
            },
        });

        return data.data ?? [];
    }

    /**
     * List projects.
     * @description Return a list containing all projects.
     */
    async listProjects(
        query: TimingTypes.Projects.List.Params = {},
    ): Promise<TimingTypes.Projects.List.Response> {
        const { data } = await this._client.GET('/api/v1/projects', {
            params: {
                query: {
                    title: query.title,
                    team_id: Timing.entryIDFromReference(query.team_id) as unknown as number,
                    hide_archived: booleanToInt(query.hide_archived) as unknown as boolean,
                }
            },
        });

        return data.data ?? [];
    }
    
    /**
     * Create project.
     * @description Create a new project.
     */
    async createProject(
        body: TimingTypes.Projects.Create.RequestBody,
    ): Promise<{
        data: TimingTypes.Projects.Create.Response,
        entriesParams?: TimingTypes.TimeEntries.List.Params,
    }> {
        const { data } = await this._client.POST('/api/v1/projects', {
            params: {},
            body: body,
        });

        let entriesParams: TimingTypes.TimeEntries.List.Params | undefined;
        if (data.links?.['time-entries'] && data.data.self) {
            entriesParams = {
                projects: [data.data.self],
            };
        }

        return {
            data: data.data,
            entriesParams: entriesParams,
        };
    }

    /**
     * Show project.
     * @description Display the specified project.
     * 
     * Child projects are provided as references; i.e. they only contain the `self` attribute.
     * @param projectId The ID or full reference of the project to display.
     */
    async showProject(
        projectId: TimingTypes.Projects.Show.PathParam | string,
    ): Promise<TimingTypes.Projects.Show.Response> {
        const { data } = await this._client.GET('/api/v1/projects/{project_id}', {
            params: {
                path: {
                    project_id: Timing.entryIDFromReference(projectId) as unknown as number,
                },
            },
        });

        return data.data;
    }

    /**
     * Update project.
     * @description Update the specified project.
     * @param projectId The ID of the project to update
     * @param body New data to update on the specified project.
     */
    async updateProject(
        projectId: TimingTypes.Projects.Update.PathParam | string,
        body: TimingTypes.Projects.Update.RequestBody,
    ): Promise<TimingTypes.Projects.Update.Response> {
        const { data } = await this._client.PUT('/api/v1/projects/{project_id}', {
            params: {
                path: {
                    project_id: Timing.entryIDFromReference(projectId) as unknown as number,
                },
            },
            body: body,
        });

        return data.data;
    }

    /**
     * Delete project.
     * @description Delete the specified project and all of its children.
     * @param projectId The ID of the project to update
     * @param body New data to update on the specified project.
     */
    async deleteProject(
        projectId: TimingTypes.Projects.Delete.PathParam | string,
    ) {
        await this._client.DELETE('/api/v1/projects/{project_id}', {
            params: {
                path: {
                    project_id: Timing.entryIDFromReference(projectId) as unknown as number,
                },
            },
        });
    }

    // MARK: Reports

    /**
     * Generate report.
     * @description Generate a report that can contain both time entries and app usage.
     *
     * Returns a JSON array with several rows; each row includes the total duration (in seconds) belonging to the
     *     corresponding other (configurable) columns.
     *
     * The `include_app_usage` and `include_team_members` parameters govern whether to include app usage (otherwise, only time entries are returned) as well as data for other team members.
     *     
     * The `start_date_min`, `start_date_max`, `projects`(also see `include_child_projects`) and `search_query` parameters allow filtering the returned data.
     * 
     * The `columns`, `project_grouping_level`, `include_project_data`, `timespan_grouping_mode`, and `sort` parameters govern the presentation of the returned data.
     *
     * Fetching large amounts of app usage can put a substantial amount of load on our servers, so please be mindful before frequently requesting large amounts of data using this API.
     * 
     * If no date range filter is provided by setting **both** `start_date_min` **and** `start_date_max`, this query returns all time entries between midnight (UTC) 30 days ago and end of day (UTC) today.
     */
    async generateReport(
        query: TimingTypes.Reports.Generate.Params,
    ): Promise<TimingTypes.Reports.Generate.Response> {
        const { data } = await this._client.GET('/api/v1/report', {
            params: {
                query: query,
            },
        });

        return data.data;
    }

    // MARK: Teams

    /**
     * List team members.
     * @description Return a list containing all active members of the given team.
     * 
     * Members with pending invitations will be excluded.
     * @param teamId The ID of the team to list members for.
     */
    async listTeamMembers(
        teamId: TimingTypes.Teams.Members.PathParam | string,
    ): Promise<TimingTypes.Teams.Members.Response> {
        const { data } = await this._client.GET('/api/v1/teams/{team_id}/members', {
            params: {
                path: {
                    team_id: Timing.entryIDFromReference(teamId) as unknown as number,
                },
            },
        });

        return data.data;
    }

    /**
     * List teams.
     * @description Return a list containing all the teams you are a member of.
     */
    async listTeams(): Promise<TimingTypes.Teams.List.Response> {
        const { data } = await this._client.GET('/api/v1/teams', {
            params: {},
        });

        return data.data;
    }

    // MARK: Time Entries

    /**
     * Start timer.
     * @description Start a new timer.
     *
     * This also stops the currently running timer if there is one.
     *
     * The `title` and `project` fields cannot both be empty.
     */
    async startTimer(
        body: TimingTypes.TimeEntries.Start.RequestBody,
    ): Promise<TimingTypes.TimeEntries.Start.Response> {
        const { data } = await this._client.POST('/api/v1/time-entries/start', {
            params: {},
            body: body,
        });

        return data.data;
    }

    /**
     * Stop timer.
     * @description Stop the currently running timer.
     */
    async stopTimer(): Promise<TimingTypes.TimeEntries.Stop.Response> {
        const { data } = await this._client.PUT('/api/v1/time-entries/stop', {
            params: {},
        });

        return data.data;
    }

    /**
     * Show latest time entry.
     * @description Redirect to the latest time entry.
     * @returns If one is found, returns its `activity_id` parameter for the `showTimeEntry()` function.
     */
    async showLatestTimeEntry(): Promise<TimingTypes.TimeEntries.ShowLatest.Response | undefined> {
        const { data, error, response } = await this._client.GET('/api/v1/time-entries/latest', {
            params: {},
        });

        if (response.redirected && response.headers.has('location')) {
            const activityID = Timing.entryIDFromReference(
                response.headers.get('location')?.[0],
            );
            
            return activityID.toString();
        }
        
        return undefined;
    }

    /**
     * Show running timer.
     * @description Redirect to the currently running timer.
     */
    async showRunningTimer(): Promise<TimingTypes.TimeEntries.ShowRunning.Response> {
        const { data, error, response } = await this._client.GET('/api/v1/time-entries/running', {
            params: {},
        });
        
        if (error) {
            return error;
        } else {
            return await response.json();
        }
    }

    /**
     * List time entries.
     * @description Return a list of time entries.
     *
     * Items are ordered descending by their `start_date` field.
     *
     * If no date range filter is provided by setting **both** `start_date_min` **and** `start_date_max`, this query returns all time entries between midnight (UTC) 30 days ago and end of day (UTC) today.
     */
    async listTimeEntries(
        query: TimingTypes.TimeEntries.List.Params,
    ): Promise<TimingTypes.TimeEntries.List.Response> {
        const { data } = await this._client.GET('/api/v1/time-entries', {
            params: {
                query: query,
            },
        });

        return data;
    }

    /**
     * Create time entry.
     * @description Create a new time entry.
     *
     * The title and project fields can not both be empty.
     */
    async createTimeEntry(
        body: TimingTypes.TimeEntries.Create.Body,
    ): Promise<TimingTypes.TimeEntries.Create.Response> {
        const { data } = await this._client.POST('/api/v1/time-entries', {
            params: {},
            body: body,
        });

        return data.data;
    }

    /**
     * Show time entry.
     * @description Display the specified time entry.
     */
    async showTimeEntry(
        activityId: TimingTypes.TimeEntries.Show.PathParam | number,
    ): Promise<TimingTypes.TimeEntries.Show.Response> {
        const { data } = await this._client.GET('/api/v1/time-entries/{activity_id}', {
            params: {
                path: {
                    activity_id: Timing.entryIDFromReference(activityId),
                },
            },
        });

        return data.data;
    }

    /**
     * Update time entry.
     * @description Update the specified time entry.
     * 
     * Omitted fields will not be updated.
     *
     * A time entry's title and project fields can not both be empty.
     */
    async updateTimeEntry(
        activityId: TimingTypes.TimeEntries.Update.PathParam | number,
        body: TimingTypes.TimeEntries.Update.Body,
    ): Promise<TimingTypes.TimeEntries.Update.Response> {
        const { data } = await this._client.PUT('/api/v1/time-entries/{activity_id}', {
            params: {
                path: {
                    activity_id: Timing.entryIDFromReference(activityId),
                },
            },
            body: body,
        });

        return data.data;
    }

    /**
     * Update time entry.
     * @description Update the specified time entry.
     * 
     * Omitted fields will not be updated.
     *
     * A time entry's title and project fields can not both be empty.
     */
    async deleteTimeEntry(
        activityId: TimingTypes.TimeEntries.Delete.PathParam | number,
    ) {
        await this._client.DELETE('/api/v1/time-entries/{activity_id}', {
            params: {
                path: {
                    activity_id: Timing.entryIDFromReference(activityId),
                },
            },
        });
    }
}

function booleanToInt(bool: boolean | undefined): number | undefined {
    if (typeof bool == 'undefined') {
        return undefined;
    } else {
        return +bool;
    }
}
