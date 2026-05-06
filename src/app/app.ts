import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FlowBuilderComponent } from './features/flow-builder/flow-builder.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, FlowBuilderComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('data-pipeline-fe');
}
