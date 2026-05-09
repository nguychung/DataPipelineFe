export interface SyncFlowPayload {
  flow_metadata: {
    id: string;
    namespace: string;
    description: string;
  };
  trigger: {
    cron: string;
  };
  auth_provider: any;
  source: {
    type: string;
    url: string;
    method: string;
    contentType: string;
    headers: Record<string, string>;
    request_param_mapping: any[];
    body_mapping: any[];
  };
  transformation_pipeline: any[];
  destination: {
    type: string;
    url: string;
    username: string;
    password?: string;
    table: string;
    columns: any[];
    upsert_key: string[];
    update_time_field: string;
  };
}