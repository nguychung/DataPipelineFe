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
import { Router } from '@angular/router';
import { FlowService } from '../../core/services/flow.service';
import { NzMessageService } from 'ng-zorro-antd/message';

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
  private router = inject(Router);
  private flowService = inject(FlowService);
  private message = inject(NzMessageService);

  isSubmitting = false;
  flowForm!: FormGroup;
  currentStep = 0;

  // Logic kiểm soát hiển thị Gallery
  isSourceGalleryVisible = true;
  isDestGalleryVisible = true;

  ngOnInit() {
    this.initForm();
    // this.fillSampleData();
  }
  initForm() {
    this.flowForm = this.fb.group({
      flow_metadata: this.fb.group({
        id: ['', Validators.required],
        namespace: ['', Validators.required],
        description: [''],
      }),
      trigger: this.fb.group({
        value: [10, [Validators.required, Validators.min(1)]], // Số lượng
        unit: ['MINUTES', Validators.required], // Đơn vị: MINUTES hoặc HOURS
      }),
      source: this.fb.group({
        type: ['', Validators.required], // ĐỂ TRỐNG ĐỂ CHỌN TỪ GALLERY
        url: ['', Validators.required],
        method: ['GET', Validators.required],
        headers: this.fb.array([]),
        request_param_mapping: this.fb.array([]),
        body_mapping: this.fb.array([]),
        response_extract_path: ['data'],
        contentType: ['application/json'],
      }),
      transformation_pipeline: this.fb.array([]),
      destination: this.fb.group({
        type: ['', Validators.required], // ĐỂ TRỐNG ĐỂ CHỌN TỪ GALLERY
        url: [
          '',
          Validators.required,
        ],
        username: ['', Validators.required],
        password: [''],
        table: ['', Validators.required],
        columns: this.fb.array([]),
        upsert_key: [],
        update_time_field: [],
      }),
    });
  }

  private fillSampleData() {
    // 1. Headers (Source) - Theo template.json
    this.sourceHeaders.push(
      this.fb.group({
        key: ['x-api-key'],
        value: ['af739005ab314cc7b547452595e6b2ce'],
      }),
    );

    // 2. Request Params Mapping (Source) - Theo template.json
    const params = [
      { field: 'start_time', offset: -6 },
      { field: 'end_time', offset: 0 },
    ];
    params.forEach((p) => {
      this.requestParams.push(
        this.fb.group({
          field: [p.field],
          type: ['datetime_expression'],
          logic: this.fb.group({
            base: ['now'],
            offset_value: [p.offset],
            offset_unit: ['HOURS'],
            format: ['yyyy-MM-dd HH:00:00'],
          }),
        }),
      );
    });

    // 3. Transformation Pipeline - Theo template.json
    this.transforms.push(
      this.fb.group({
        action: ['flatten'],
        params: [
          JSON.stringify(
            {
              root_path: 'data',
              expand_array: 'values',
              carry_forward: ['station_id'],
            },
            null,
            2,
          ),
        ],
      }),
    );
    this.transforms.push(
      this.fb.group({
        action: ['filter'],
        params: [JSON.stringify({ condition: "item['depth'] > 0" }, null, 2)],
      }),
    );

    // 4. Columns Mapping (Destination) - Theo template.json
    const columns = [
      { name: 'station_id', type: 'character varying', mapping: 'station_id' },
      { name: 'time_point', type: 'timestamp', mapping: 'time_point' },
      { name: 'depth', type: 'float', mapping: 'depth' },
      { name: 'depth_cm', type: 'float', mapping: 'depth_cm' },
    ];
    columns.forEach((col) => this.destColumns.push(this.fb.group(col)));
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
  showSourceGallery() {
    this.isSourceGalleryVisible = true;
  }
  showDestGallery() {
    this.isDestGalleryVisible = true;
  }

  // Hàm quy đổi sang mã Cron chuẩn crontab.guru
  public convertToCron(value: number, unit: string): string {
    if (!value) return '';

    switch (unit) {
      case 'MINUTES':
        return value === 1 ? '* * * * *' : `*/${value} * * * *`;
      case 'HOURS':
        return value === 1 ? '0 * * * *' : `0 */${value} * * *`;
      case 'DAYS':
        // Chạy vào 00:00 mỗi X ngày
        return value === 1 ? '0 0 * * *' : `0 0 */${value} * *`;
      default:
        return '';
    }
  }

  createMappingGroup(data: any = null) {
    return this.fb.group({
      field: [data?.field || ''],
      type: [data?.type || 'datetime_expression'],
      logic: this.fb.group({
        base: [data?.logic?.base || 'now'],
        offset_value: [data?.logic?.offset_value || 0],
        offset_unit: [data?.logic?.offset_unit || 'HOURS'], // Mặc định khớp với dropdown
        format: [data?.logic?.format || 'yyyy-MM-dd HH:00:00'],
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
  get sourceHeaders() {
    return this.flowForm.get('source.headers') as FormArray;
  }
  get requestParams() {
    return this.flowForm.get('source.request_param_mapping') as FormArray;
  }
  get bodyMappings() {
    return this.flowForm.get('source.body_mapping') as FormArray;
  }
  get transforms() {
    return this.flowForm.get('transformation_pipeline') as FormArray;
  }
  get destColumns() {
    return this.flowForm.get('destination.columns') as FormArray;
  }

  // --- Form Actions ---
  addHeader() {
    this.sourceHeaders.push(this.fb.group({ key: [''], value: [''] }));
  }
  removeHeader(i: number) {
    this.sourceHeaders.removeAt(i);
  }
  removeRequestParam(i: number) {
    this.requestParams.removeAt(i);
  }
  removeBodyMapping(i: number) {
    this.bodyMappings.removeAt(i);
  }
  addTransform() {
    this.transforms.push(this.fb.group({ action: ['flatten'], params: ['{}'] }));
  }
  removeTransform(i: number) {
    this.transforms.removeAt(i);
  }
  addColumn() {
    this.destColumns.push(
      this.fb.group({ name: [''], type: ['character varying'], mapping: [''] }),
    );
  }
  removeColumn(i: number) {
    this.destColumns.removeAt(i);
  }
  addRequestParam() {
    this.requestParams.push(this.createMappingGroup());
  }
  addBodyMapping() {
    this.bodyMappings.push(this.createMappingGroup());
  }

  next() {
    this.currentStep++;
  }
  prev() {
    this.currentStep--;
  }

  onSubmit() {
    if (this.flowForm.invalid) {
      this.markFormGroupDirty(this.flowForm);
      this.message.warning('Vui lòng hoàn thiện các trường bắt buộc!');
      return;
    }

    // 2. Bật trạng thái loading
    this.isSubmitting = true;

    const raw = this.flowForm.getRawValue();
    const payload = {
      ...raw,
      // Ghi đè trường trigger bằng mã Cron thay vì object value/unit
      trigger: {
        cron: this.convertToCron(raw.trigger.value, raw.trigger.unit),
      },
      source: { ...raw.source, headers: this.parseHeaders(raw.source.headers) },
      transformation_pipeline: raw.transformation_pipeline.map((t: any) => ({
        action: t.action,
        params: JSON.parse(t.params || '{}'),
      })),
      destination: {
        ...raw.destination,
        upsert_key: raw.destination.upsert_key ? raw.destination.upsert_key.split(',') : [],
      },
    };
    console.log('JSON OUTPUT:', payload);

    const finalPayload = {
      flowId: raw.flow_metadata.id,
      description: raw.flow_metadata.description,
      namespace: raw.flow_metadata.namespace,
      // Stringify object bên trên thành chuỗi JSON
      json: JSON.stringify(payload, null, 2),
    };

    // 4. Gọi API Save
    this.flowService.saveFlow(finalPayload).subscribe({
      next: (response) => {
        this.message.success('Save Flow successfully!');
        this.isSubmitting = false;
        // 5. Điều hướng về trang danh sách
        this.router.navigate(['/flows']);
      },
      error: (err) => {
        console.error('Save error:', err);
        this.message.error('Lỗi khi lưu: ' + (err.error?.message || 'Server Error'));
        this.isSubmitting = false;
      }
    });
  }

  private parseHeaders(arr: any[]) {
    const obj: any = {};
    arr.forEach((h) => {
      if (h.key) obj[h.key] = h.value;
    });
    return obj;
  }

  private markFormGroupDirty(formGroup: any) {
    Object.values(formGroup.controls).forEach((control: any) => {
      if (control.controls) {
        this.markFormGroupDirty(control);
      } else {
        control.markAsDirty();
        control.updateValueAndValidity();
      }
    });
  }
}
