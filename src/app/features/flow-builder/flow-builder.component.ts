import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';

// NG-ZORRO Imports
import { NzStepsModule } from 'ng-zorro-antd/steps';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { ConnectorGalleryComponent } from '../../shared/connector-gallery/connector-gallery.component';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';

@Component({
  selector: 'app-flow-builder',
  standalone: true,
  imports: [
    CommonModule,
    ConnectorGalleryComponent,
    ReactiveFormsModule,
    NzStepsModule,
    NzFormModule,
    NzInputModule,
    NzButtonModule,
    NzSelectModule,
    NzCardModule,
    NzIconModule,
    NzInputNumberModule,
  ],
  templateUrl: './flow-builder.component.html',
})
export class FlowBuilderComponent implements OnInit {
  private fb = inject(FormBuilder);

  flowForm!: FormGroup;
  currentStep = 0;

  // Logic kiểm soát hiển thị Gallery
  isSourceGalleryVisible = true;
  isDestGalleryVisible = true;

  ngOnInit() {
  this.initForm();
    this.fillSampleData();
  }
initForm() {
    this.flowForm = this.fb.group({
      flow_metadata: this.fb.group({
        id: ['fetch-and-upsert-data-tram-do-mua', Validators.required],
        namespace: ['company.team', Validators.required],
        description: ['Fetch trạm đo mưa mỗi 10 phút']
      }),
      trigger: this.fb.group({
        minutes: [10, [Validators.required, Validators.min(1)]]
      }),
      source: this.fb.group({
        type: ['', Validators.required], // ĐỂ TRỐNG ĐỂ CHỌN TỪ GALLERY
        url: ['https://vwater-open.vrain.vn/v1/stations/stats', Validators.required],
        method: ['GET', Validators.required],
        headers: this.fb.array([]),
        request_param_mapping: this.fb.array([]),
        body_mapping: this.fb.array([]),
        response_extract_path: ['data'],
        contentType: ['application/json']
      }),
      transformation_pipeline: this.fb.array([]),
      destination: this.fb.group({
        type: ['', Validators.required], // ĐỂ TRỐNG ĐỂ CHỌN TỪ GALLERY
        url: ['jdbc:postgresql://171.254.95.51:5432/kestra?currentSchema=test_data', Validators.required],
        username: ['cbtt', Validators.required],
        password: ['cbtt@#2023'],
        table: ['thong_ke_tram_do_mua', Validators.required],
        columns: this.fb.array([]),
        upsert_key: ['station_id, time_point'],
        update_time_field: ['updated_date']
      })
    });
  }

  private fillSampleData() {
    // 1. Headers (Source) - Theo template.json
    this.sourceHeaders.push(this.fb.group({
      key: ['x-api-key'],
      value: ['af739005ab314cc7b547452595e6b2ce']
    }));

    // 2. Request Params Mapping (Source) - Theo template.json
    const params = [
      { field: 'start_time', offset: -6 },
      { field: 'end_time', offset: 0 }
    ];
    params.forEach(p => {
      this.requestParams.push(this.fb.group({
        field: [p.field],
        type: ['datetime_expression'],
        logic: this.fb.group({
          base: ['now'],
          offset_value: [p.offset],
          offset_unit: ['HOURS'],
          format: ['yyyy-MM-dd HH:00:00']
        })
      }));
    });

    // 3. Transformation Pipeline - Theo template.json
    this.transforms.push(this.fb.group({
      action: ['flatten'],
      params: [JSON.stringify({
        root_path: "data",
        expand_array: "values",
        carry_forward: ["station_id"]
      }, null, 2)]
    }));
    this.transforms.push(this.fb.group({
      action: ['filter'],
      params: [JSON.stringify({ condition: "item['depth'] > 0" }, null, 2)]
    }));

    // 4. Columns Mapping (Destination) - Theo template.json
    const columns = [
      { name: 'station_id', type: 'character varying', mapping: 'station_id' },
      { name: 'time_point', type: 'timestamp', mapping: 'time_point' },
      { name: 'depth', type: 'float', mapping: 'depth' },
      { name: 'depth_cm', type: 'float', mapping: 'depth_cm' }
    ];
    columns.forEach(col => this.destColumns.push(this.fb.group(col)));
  }

    // initForm() {
    //   this.flowForm = this.fb.group({
    //     flow_metadata: this.fb.group({
    //       id: ['fetch-and-upsert-data-tram-do-mua', Validators.required],
    //       namespace: ['company.team', Validators.required],
    //       description: ['Fetch trạm đo mưa mỗi 10p']
    //     }),
    //     trigger: this.fb.group({
    //       cron: ['*/10 * * * *', Validators.required]
    //     }),
    //     auth_provider: [null],
    //     source: this.fb.group({
    //       type: ['REST_API', Validators.required],
    //       url: ['https://vwater-open.vrain.vn/v1/stations/stats', Validators.required],
    //       method: ['GET', Validators.required],
    //       contentType: ['application/json'],
    //       headers: this.fb.array([
    //         this.createHeaderGroup('x-api-key', 'af739005ab314cc7b547452595e6b2ce')
    //       ]),
    //       request_param_mapping: this.fb.array([
    //         this.createRequestParamGroup('start_time', 'datetime_expression', 'now', -6, 'HOURS', 'yyyy-MM-dd HH:00:00'),
    //         this.createRequestParamGroup('end_time', 'datetime_expression', 'now', 0, 'HOURS', 'yyyy-MM-dd HH:00:00')
    //       ]),
    //       body_mapping: this.fb.array([]),
    //       response_extract_path: ['data']
    //     }),
    //     transformation_pipeline: this.fb.array([
    //       this.createTransformGroup('flatten', { root_path: 'data', expand_array: 'values', carry_forward: ['station_id'] }),
    //       this.createTransformGroup('filter', { condition: "item['depth'] > 0" }),
    //       this.createTransformGroup('calculate', { new_field: 'depth_cm', formula: "item['depth'] * 100" })
    //     ]),
    //     destination: this.fb.group({
    //       type: ['POSTGRESQL', Validators.required],
    //       url: ['jdbc:postgresql://171.254.95.51:5432/kestra?currentSchema=test_data', Validators.required],
    //       username: ['cbtt', Validators.required],
    //       password: ['cbtt@#2023'],
    //       table: ['thong_ke_tram_do_mua', Validators.required],
    //       columns: this.fb.array([
    //         this.createColumnGroup('station_id', 'character varying', 'station_id'),
    //         this.createColumnGroup('time_point', 'timestamp', 'time_point'),
    //         this.createColumnGroup('depth', 'float', 'depth'),
    //         this.createColumnGroup('depth_cm', 'float', 'depth_cm')
    //       ]),
    //       upsert_key: ['station_id, time_point'],
    //       update_time_field: ['updated_date']
    //     })
    //   });
    // }

  // --- Helpers khởi tạo FormGroup cho FormArray ---
  createHeaderGroup(key = '', value = '') {
    return this.fb.group({ key: [key, Validators.required], value: [value, Validators.required] });
  }

  // Set Type và ẩn Gallery
  setSourceType(type: string) {
    this.flowForm.get('source.type')?.setValue(type);
    this.isSourceGalleryVisible = false;
  }

  setDestType(type: string) {
    this.flowForm.get('destination.type')?.setValue(type);
    this.isDestGalleryVisible = false;
  }

  // Mở lại Gallery nếu muốn chọn lại
  showSourceGallery() { this.isSourceGalleryVisible = true; }
  showDestGallery() { this.isDestGalleryVisible = true; }

  createRequestParamGroup(
    field = '',
    type = '',
    base = '',
    offset_value = 0,
    offset_unit = '',
    format = '',
  ) {
    return this.fb.group({
      field: [field],
      type: [type],
      logic: this.fb.group({
        base: [base],
        offset_value: [offset_value],
        offset_unit: [offset_unit],
        format: [format],
      }),
    });
  }

  createTransformGroup(action = '', params: any = {}) {
    return this.fb.group({
      action: [action],
      params: [JSON.stringify(params)], // Dùng stringify trên UI để dễ nhập, lúc submit sẽ parse lại JSON
    });
  }

  createColumnGroup(name = '', type = '', mapping = '') {
    return this.fb.group({ name: [name], type: [type], mapping: [mapping] });
  }

  // --- Getters ---
  get sourceHeaders() { return this.flowForm.get('source.headers') as FormArray; }
  get requestParams() { return this.flowForm.get('source.request_param_mapping') as FormArray; }
  get bodyMappings() { return this.flowForm.get('source.body_mapping') as FormArray; }
  get transforms() { return this.flowForm.get('transformation_pipeline') as FormArray; }
  get destColumns() { return this.flowForm.get('destination.columns') as FormArray; }

  // --- Form Actions ---
  addHeader() { this.sourceHeaders.push(this.fb.group({ key: [''], value: [''] })); }
  removeHeader(i: number) { this.sourceHeaders.removeAt(i); }
  addRequestParam() { this.requestParams.push(this.fb.group({ field: [''], type: [''], logic: this.fb.group({ base: ['now'], offset_value: [0], offset_unit: ['HOURS'], format: ['yyyy-MM-dd HH:00:00'] }) })); }
  removeRequestParam(i: number) { this.requestParams.removeAt(i); }
  addBodyMapping() { this.bodyMappings.push(this.fb.group({ field: [''], type: [''] })); }
  removeBodyMapping(i: number) { this.bodyMappings.removeAt(i); }
  addTransform() { this.transforms.push(this.fb.group({ action: ['flatten'], params: ['{}'] })); }
  removeTransform(i: number) { this.transforms.removeAt(i); }
  addColumn() { this.destColumns.push(this.fb.group({ name: [''], type: ['character varying'], mapping: [''] })); }
  removeColumn(i: number) { this.destColumns.removeAt(i); }

  next() { this.currentStep++; }
  prev() { this.currentStep--; }

  onSubmit() {
    const raw = this.flowForm.getRawValue();
    const finalPayload = {
      ...raw,
      trigger: { cron: `*/${raw.trigger.minutes} * * * *` },
      source: { ...raw.source, headers: this.parseHeaders(raw.source.headers) },
      transformation_pipeline: raw.transformation_pipeline.map((t: any) => ({ action: t.action, params: JSON.parse(t.params || '{}') })),
      destination: { ...raw.destination, upsert_key: raw.destination.upsert_key ? raw.destination.upsert_key.split(',') : [] }
    };
    console.log('JSON OUTPUT:', finalPayload);
  }

  private parseHeaders(arr: any[]) {
    const obj: any = {};
    arr.forEach(h => { if (h.key) obj[h.key] = h.value; });
    return obj;
  }
}
