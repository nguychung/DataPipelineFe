import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
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
import { switchMap } from 'rxjs';

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
  private cdr = inject(ChangeDetectorRef);

  isSubmitting = false;
  flowForm!: FormGroup;
  currentStep = 0;

  showAuthProvider = false; // Điều khiển ẩn hiện form Auth
  isLoadingTest = false; // Trạng thái loading cho nút Test Connection

  // Logic kiểm soát hiển thị Gallery
  isSourceGalleryVisible = true;
  isDestGalleryVisible = true;

  // Danh sách các action và JSON mặc định tương ứng
  DEFAULT_ACTION_PARAMS: { [key: string]: string } = {
    MAP_FIELD: JSON.stringify({ source_field: '', target_field: '' }, null, 2),
    FILTER: JSON.stringify({ condition: 'field > 10' }, null, 2),
    CONVERT_TYPE: JSON.stringify({ field: '', to_type: 'number' }, null, 2),
    REPLACE: JSON.stringify({ field: '', old_value: '', new_value: '' }, null, 2),
    CUSTOM_SCRIPT: JSON.stringify({ script: 'return data;' }, null, 2),
  };

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
        value: [10, [Validators.required, Validators.min(1)]],
        unit: ['MINUTES', Validators.required],
      }),
      source: this.fb.group({
        type: ['', Validators.required],
        url: ['', Validators.required],
        method: ['GET', Validators.required],
        headers: this.fb.array([]),
        request_param_mapping: this.fb.array([]),
        body_mapping: this.fb.array([]), // Mảng chính chúng ta đang xử lý
        response_extract_path: ['data'],
        contentType: ['application/json'],

        auth_provider: this.fb.group({
          id: ['get_token'], // Có thể dùng để lưu loại auth nếu muốn
          url: ['https://tich-hop-du-lieu.vgis.vn/api/mock/auth'],
          method: ['POST'],
          headers: this.fb.array([]),
          param: this.fb.array([]),
          body: this.fb.array([]),
          token_extract_path: ['data.access_token'],
          auth_type: ['Bearer'],
        }),
      }),
      transformation_pipeline: this.fb.array([]),
      destination: this.fb.group({
        type: ['', Validators.required],
        url: ['', Validators.required],
        username: ['', Validators.required],
        password: [''],
        table: ['', Validators.required],
        columns: this.fb.array([]),
        upsert_key: [],
        update_time_field: [],
      }),
    });
  }

  // Hàm tạo item với đầy đủ 4 trường trong logic
  createMappingItem(): FormGroup {
    return this.fb.group({
      field: ['', Validators.required],
      type: ['string'],
      value: [''], // Dùng cho type 'string' hoặc 'number'

      // Logic cho datetime_expression với 4 trường bạn yêu cầu
      logic: this.fb.group({
        base: ['now'], // 1. Base
        offset_value: [-6], // 2. Offset (giá trị số)
        offset_unit: ['HOURS'], // 3. Unit (HOURS, DAYS, MINUTES...)
        format: ['dd/MM/yyyy HH:00'], // 4. Format
      }),
    });
  }

  // Getters để truy cập FormArray nhanh từ HTML
  get bodyMappingArray(): FormArray {
    return this.flowForm.get('source.body_mapping') as FormArray;
  }

  get bodyAuthMappingArray(): FormArray {
    return this.flowForm.get('source.auth_provider.body') as FormArray;
  }

  get paramMappingArray(): FormArray {
    return this.flowForm.get('source.request_param_mapping') as FormArray;
  }

  get paramAuthMappingArray(): FormArray {
    return this.flowForm.get('source.auth_provider.param') as FormArray;
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
    if (type !== 'REST_API') {
      this.message.info('Chức năng đang phát triển!');
    } else {
      this.flowForm.get('source.type')?.setValue(type);
      this.isSourceGalleryVisible = false;
    }
  }

  setDestType(type: string) {
    if (type !== 'POSTGRESQL') {
      this.message.info('Chức năng đang phát triển!');
    } else {
      this.flowForm.get('destination.type')?.setValue(type);
      this.isDestGalleryVisible = false;
    }
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

  // createTransformGroup(action = '', params: any = {}) {
  //   return this.fb.group({
  //     action: [action],
  //     params: [JSON.stringify(params)], // Dùng stringify trên UI để dễ nhập, lúc submit sẽ parse lại JSON
  //   });
  // }

  createColumnGroup(name = '', type = '', mapping = '') {
    return this.fb.group({ name: [name], type: [type], mapping: [mapping] });
  }

  // --- Getters ---
  get sourceHeaders() {
    return this.flowForm.get('source.headers') as FormArray;
  }

  get sourceAuthHeaders() {
    return this.flowForm.get('source.auth_provider.headers') as FormArray;
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

  addHeaderToken() {
    this.sourceHeaders.push(
      this.fb.group({ key: ['Authorization'], value: ['data.access_token'] }),
    );
  }

  addAuthHeader() {
    this.sourceAuthHeaders.push(this.fb.group({ key: [''], value: [''] }));
  }

  removeHeader(i: number) {
    this.sourceHeaders.removeAt(i);
  }

  removeAuthHeader(i: number) {
    this.sourceAuthHeaders.removeAt(i);
  }

  removeRequestParam(i: number) {
    this.paramMappingArray.removeAt(i);
  }

  removeAuthRequestParam(i: number) {
    this.paramAuthMappingArray.removeAt(i);
  }

  addBodyMapping() {
    this.bodyMappingArray.push(this.createMappingItem());
  }

  addAuthBodyMapping() {
    this.bodyAuthMappingArray.push(this.createMappingItem());
  }

  removeBodyMapping(index: number) {
    this.bodyMappingArray.removeAt(index);
  }

  removeAuthBodyMapping(index: number) {
    this.bodyAuthMappingArray.removeAt(index);
  }

  addTransform() {
    this.transforms.push(this.createTransformGroup());
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
    this.paramMappingArray.push(this.createMappingItem());
  }

  addAuthRequestParam() {
    this.paramAuthMappingArray.push(this.createMappingItem());
  }

  next() {
    this.currentStep++;
  }
  prev() {
    this.currentStep--;
  }

  testConnection() {
    this.isLoadingTest = true;
    const authConfig = this.flowForm.getRawValue().source.auth_provider;

    const sourceData = this.flowForm.getRawValue().source;

    // Gọi api get token

    if (this.showAuthProvider && authConfig.url) {
      this.isLoadingTest = true;

      // Luồng xử lý: Nếu có Auth -> Lấy Token -> Gọi API chính. Nếu không -> Gọi API chính luôn.
      const connection$ =
        this.showAuthProvider && sourceData.auth_provider?.url
          ? this.flowService.getToken(sourceData.auth_provider).pipe(
              switchMap((token) => {
                console.log('🚀 chungnm2 ~ flow-builder.component.ts ~ token:', token);
                // this.message.success('Auth successful, calling main API...');
                return this.flowService.callMainApi(token, sourceData);
              }),
            )
          : this.flowService.callMainApi('', sourceData);

      connection$.subscribe({
        next: (res) => {
          this.message.success('Connection Successful!');
          console.log('API Response:', res);
          this.isLoadingTest = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.message.error('Connection Failed: ' + (err.message || 'Unknown error'));
          this.isLoadingTest = false;
          this.cdr.detectChanges();
        },
      });
    } else {
      console.log('lỗi!!!!');
      // this.callMainApi();
    }
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

    const formattedParamMapping = raw.source.request_param_mapping.map((item: any) => {
      if (item.type === 'datetime_expression') {
        return {
          field: item.field,
          type: 'datetime_expression',
          logic: {
            base: item.logic.base,
            offset_value: item.logic.offset_value,
            offset_unit: item.logic.offset_unit,
            format: item.logic.format,
          },
        };
      } else {
        return {
          field: item.field,
          type: 'constant',
          value: item.value,
        };
      }
    });

    const formattedBodyMapping = raw.source.body_mapping.map((item: any) => {
      if (item.type === 'datetime_expression') {
        return {
          field: item.field,
          type: 'datetime_expression',
          logic: {
            base: item.logic.base,
            offset_value: item.logic.offset_value,
            offset_unit: item.logic.offset_unit,
            format: item.logic.format,
          },
        };
      } else {
        return {
          field: item.field,
          type: 'constant',
          value: item.type === 'number' ? Number(item.value) : item.value,
        };
      }
    });

    const payload = {
      ...raw,
      // Ghi đè trường trigger bằng mã Cron thay vì object value/unit
      trigger: {
        cron: this.convertToCron(raw.trigger.value, raw.trigger.unit),
      },
      source: {
        ...raw.source,
        headers: this.parseHeaders(raw.source.headers),
        request_param_mapping: formattedParamMapping,
        body_mapping: formattedBodyMapping,
      },
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
    // this.flowService.saveFlow(finalPayload).subscribe({
    //   next: (response) => {
    //     this.message.success('Save Flow successfully!');
    //     this.isSubmitting = false;
    //     // 5. Điều hướng về trang danh sách
    //     this.router.navigate(['/flows']);
    //   },
    //   error: (err) => {
    //     console.error('Save error:', err);
    //     this.message.error('Lỗi khi lưu: ' + (err.error?.message || 'Server Error'));
    //     this.isSubmitting = false;
    //   },
    // });
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

  // Danh sách default params cho transformation
  TRANSFORM_DEFAULT_PARAMS: Record<string, any> = {
    extract: {
      path: 'data',
    },

    flatten: {
      expand_array: 'values',
      carry_forward: ['station_id'],
    },

    filter: {
      condition: "item['depth'] > 0",
    },

    calculate: {
      action: 'calculate',
      params: {
        new_field: 'dew',
        formula: "get_path(item, 'iaqi.dew.v')",
      },
    },
  };

  createTransformGroup(action = 'extract') {
    return this.fb.group({
      action: [action],
      params: [JSON.stringify(this.TRANSFORM_DEFAULT_PARAMS[action] || {}, null, 2)],
    });
  }

  onTransformActionChange(index: number) {
    const transformGroup = this.transforms.at(index) as FormGroup;
    console.log("test")
    const action = transformGroup.get('action')?.value;

    const defaultParams = this.TRANSFORM_DEFAULT_PARAMS[action] || {};

    transformGroup.patchValue({
      params: JSON.stringify(defaultParams, null, 2),
    });
  }
}
