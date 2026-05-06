import { Routes } from '@angular/router';
import { FlowBuilderComponent } from './features/flow-builder/flow-builder.component';
import { MainLayoutComponent } from './layouts/main-layout/main-layout.component';
import { FlowListComponent } from './features/flow-list/flow-list.component';

export const routes: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      { path: '', redirectTo: 'flows', pathMatch: 'full' },
      { path: 'flows', component: FlowListComponent },
      { path: 'flows/create', component: FlowBuilderComponent }
    ]
  }
];