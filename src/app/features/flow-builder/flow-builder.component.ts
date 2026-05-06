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

@Component({
  selector: 'app-flow-builder',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule,
    NzStepsModule, NzFormModule, NzInputModule, NzButtonModule, NzSelectModule, NzCardModule, NzIconModule
  ],
  templateUrl: './flow-builder.component.html',
})
export class FlowBuilderComponent implements OnInit {
  private fb = inject(FormBuilder);
  
  flowForm!: FormGroup;
  currentStep = 0;

  ngOnInit() {
    this.initForm();
  }

  initForm() {
    this.flowForm = this.fb.group({
      flow_metadata: this.fb.group({
        id: ['fetch-and-upsert-data-tram-do-mua', Validators.required],
        namespace: ['company.team', Validators.required],
        description: ['Fetch trạm đo mưa mỗi 10p']
      }),
      trigger: this.fb.group({
        cron: ['*/10 * * * *', Validators.required]
      }),
      auth_provider: [null],
      source: this.fb.group({
        type: ['REST_API', Validators.required],
        url: ['https://vwater-open.vrain.vn/v1/stations/stats', Validators.required],
        method: ['GET', Validators.required],
        contentType: ['application/json'],
        headers: this.fb.array([
          this.createHeaderGroup('x-api-key', 'af739005ab314cc7b547452595e6b2ce')
        ]),
        request_param_mapping: this.fb.array([
          this.createRequestParamGroup('start_time', 'datetime_expression', 'now', -6, 'HOURS', 'yyyy-MM-dd HH:00:00'),
          this.createRequestParamGroup('end_time', 'datetime_expression', 'now', 0, 'HOURS', 'yyyy-MM-dd HH:00:00')
        ]),
        body_mapping: this.fb.array([]),
        response_extract_path: ['data']
      }),
      transformation_pipeline: this.fb.array([
        this.createTransformGroup('flatten', { root_path: 'data', expand_array: 'values', carry_forward: ['station_id'] }),
        this.createTransformGroup('filter', { condition: "item['depth'] > 0" }),
        this.createTransformGroup('calculate', { new_field: 'depth_cm', formula: "item['depth'] * 100" })
      ]),
      destination: this.fb.group({
        type: ['POSTGRESQL', Validators.required],
        url: ['jdbc:postgresql://171.254.95.51:5432/kestra?currentSchema=test_data', Validators.required],
        username: ['cbtt', Validators.required],
        password: ['cbtt@#2023'],
        table: ['thong_ke_tram_do_mua', Validators.required],
        columns: this.fb.array([
          this.createColumnGroup('station_id', 'character varying', 'station_id'),
          this.createColumnGroup('time_point', 'timestamp', 'time_point'),
          this.createColumnGroup('depth', 'float', 'depth'),
          this.createColumnGroup('depth_cm', 'float', 'depth_cm')
        ]),
        upsert_key: ['station_id, time_point'], 
        update_time_field: ['updated_date']
      })
    });
  }

  // --- Helpers khởi tạo FormGroup cho FormArray ---
  createHeaderGroup(key = '', value = '') {
    return this.fb.group({ key: [key, Validators.required], value: [value, Validators.required] });
  }

  createRequestParamGroup(field = '', type = '', base = '', offset_value = 0, offset_unit = '', format = '') {
    return this.fb.group({
      field: [field],
      type: [type],
      logic: this.fb.group({ base: [base], offset_value: [offset_value], offset_unit: [offset_unit], format: [format] })
    });
  }

  createTransformGroup(action = '', params: any = {}) {
    return this.fb.group({
      action: [action],
      params: [JSON.stringify(params)] // Dùng stringify trên UI để dễ nhập, lúc submit sẽ parse lại JSON
    });
  }

  createColumnGroup(name = '', type = '', mapping = '') {
    return this.fb.group({ name: [name], type: [type], mapping: [mapping] });
  }

  // --- Getters cho FormArray ---
  get sourceHeaders() { return this.flowForm.get('source.headers') as FormArray; }
  get requestParams() { return this.flowForm.get('source.request_param_mapping') as FormArray; }
  get transforms() { return this.flowForm.get('transformation_pipeline') as FormArray; }
  get destColumns() { return this.flowForm.get('destination.columns') as FormArray; }

  // --- Actions thêm/xóa ---
  addHeader() { this.sourceHeaders.push(this.createHeaderGroup()); }
  removeHeader(i: number) { this.sourceHeaders.removeAt(i); }

  addRequestParam() { this.requestParams.push(this.createRequestParamGroup()); }
  removeRequestParam(i: number) { this.requestParams.removeAt(i); }

  addTransform() { this.transforms.push(this.createTransformGroup()); }
  removeTransform(i: number) { this.transforms.removeAt(i); }

  addColumn() { this.destColumns.push(this.createColumnGroup()); }
  removeColumn(i: number) { this.destColumns.removeAt(i); }

  // --- Stepper Navigation ---
  next() { this.currentStep++; }
  prev() { this.currentStep--; }

  // --- Submit & Build JSON ---
  onSubmit() {
    if (this.flowForm.invalid) {
      Object.values(this.flowForm.controls).forEach(control => {
        control.markAsDirty();
        control.updateValueAndValidity({ onlySelf: true });
      });
      return;
    }

    const rawData = this.flowForm.value;

    // 1. Convert mảng headers [{key, value}] thành Object {"x-api-key": "..."}
    const headerObject: Record<string, string> = {};
    rawData.source.headers.forEach((h: any) => { if (h.key) headerObject[h.key] = h.value; });

    // 2. Parse lại chuỗi JSON params trong transformation_pipeline
    const processedTransforms = rawData.transformation_pipeline.map((t: any) => {
      let parsedParams = {};
      try { parsedParams = JSON.parse(t.params); } catch (e) { parsedParams = t.params; }
      return { action: t.action, params: parsedParams };
    });

    // 3. Convert chuỗi upsert_key cách nhau dấu phẩy thành mảng
    const upsertKeyArray = typeof rawData.destination.upsert_key === 'string' 
      ? rawData.destination.upsert_key.split(',').map((k: string) => k.trim()) 
      : rawData.destination.upsert_key;

    // 4. Lắp ráp Payload cuối cùng
    const finalPayload = {
      ...rawData,
      source: { ...rawData.source, headers: headerObject },
      transformation_pipeline: processedTransforms,
      destination: { ...rawData.destination, upsert_key: upsertKeyArray }
    };

    console.log('FINAL JSON FOR API:', JSON.stringify(finalPayload, null, 2));
    alert('Đã sinh JSON thành công! Hãy mở Console (F12) để xem chi tiết.');
  }
}