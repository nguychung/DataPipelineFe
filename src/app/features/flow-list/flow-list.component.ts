import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NzTableModule, NzTableQueryParams } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { FlowService } from '../../core/services/flow.service';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzCardModule } from "ng-zorro-antd/card";

@Component({
  selector: 'app-flow-list',
  standalone: true,
  imports: [CommonModule, RouterModule, NzTableModule, NzButtonModule, NzTagModule, NzCardModule],
  templateUrl: './flow-list.component.html',
})
export class FlowListComponent {
  private flowService = inject(FlowService);
  private message = inject(NzMessageService);
  private cdr = inject(ChangeDetectorRef);

  flows: any[] = [];
  total = 0;
  pageSize = 10;
  pageIndex = 1;
  loading = true;

  ngOnInit(): void {
    this.loadDataFromServer(this.pageIndex, this.pageSize);
  }

  onQueryParamsChange(params: any): void {
    console.log(params);
    const { pageSize, pageIndex, sort, filter } = params;

    // Lưu lại trạng thái hiện tại để UI đồng bộ
    this.pageIndex = pageIndex;
    this.pageSize = pageSize;

    this.loadDataFromServer(pageIndex, pageSize);
  }

  loadDataFromServer(index: number, size: number): void {
    this.pageIndex = index;
    this.pageSize = size;
    console.log('--- ĐÃ GỌI API VỚI ---', index, size);

    this.loading = true;
    this.flowService.getFlows(index, size).subscribe({
      next: (res) => {
        this.flows = res.data?.results || [];
        this.total = res.data?.total || 0;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  deleteFlow(id: string) {
    this.flowService.deleteFlow(id).subscribe(() => {
      this.message.success('Đã xóa flow');
      this.loadDataFromServer(this.pageIndex, this.pageSize);
    });
  }
}