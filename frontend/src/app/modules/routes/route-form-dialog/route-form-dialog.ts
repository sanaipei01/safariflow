import { Component, effect, inject, input, model, output, signal, untracked } from '@angular/core';
import { FormControl, NonNullableFormBuilder, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { getErrorMessage } from '../../../core/utils/http-error';
import { MatatuRoute } from '../models/matatu-route.model';
import { RouteService } from '../services/route.service';

const STATUS_OPTIONS = [
  { label: 'Active', value: true },
  { label: 'Inactive', value: false },
];

const MIN_STAGES = 2;
const MAX_STAGES = 30;

/** The pop-up for adding a route, or for editing the route passed in. */
@Component({
  selector: 'app-route-form-dialog',
  standalone: false,
  templateUrl: './route-form-dialog.html',
  styleUrl: './route-form-dialog.css',
})
export class RouteFormDialog {
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly routeService = inject(RouteService);

  readonly visible = model(false);
  readonly route = input<MatatuRoute | null>(null);
  readonly saved = output<void>();

  protected readonly statusOptions = STATUS_OPTIONS;
  protected readonly minStages = MIN_STAGES;
  protected readonly maxStages = MAX_STAGES;
  protected readonly saving = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly form = this.formBuilder.group({
    name: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(100)]],
    routeNumber: ['', Validators.maxLength(10)],
    fare: this.formBuilder.control<number | null>(null, [Validators.min(0), Validators.max(10000)]),
    isActive: [true],
    stages: this.formBuilder.array([this.newStage(), this.newStage()]),
  });

  constructor() {
    // each time the pop-up opens: an empty form, or the route to edit
    effect(() => {
      if (this.visible()) {
        untracked(() => this.prepare());
      }
    });
  }

  protected get stages() {
    return this.form.controls.stages;
  }

  protected addStage(): void {
    this.stages.push(this.newStage());
  }

  protected removeStage(index: number): void {
    this.stages.removeAt(index);
  }

  /** Moves a stage one place up (-1) or down (+1) the route. */
  protected moveStage(index: number, step: -1 | 1): void {
    const stage = this.stages.at(index);
    this.stages.removeAt(index);
    this.stages.insert(index + step, stage);
  }

  protected close(): void {
    this.visible.set(false);
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { name, routeNumber, fare, isActive, stages } = this.form.getRawValue();
    const request = {
      name: name.trim(),
      routeNumber: routeNumber.trim() || null,
      fare,
      isActive,
      stages: stages.map((stage) => stage.trim()),
    };
    const route = this.route();
    const save$ = route
      ? this.routeService.update(route.id, request)
      : this.routeService.create(request);

    this.saving.set(true);
    this.errorMessage.set(null);
    save$.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: () => {
        this.visible.set(false);
        this.saved.emit();
      },
      error: (error: unknown) => this.errorMessage.set(getErrorMessage(error)),
    });
  }

  private prepare(): void {
    this.errorMessage.set(null);
    this.stages.clear();
    const route = this.route();
    if (route) {
      route.stages.forEach((stage) => this.stages.push(this.newStage(stage.name)));
      this.form.patchValue({
        name: route.name,
        routeNumber: route.routeNumber ?? '',
        fare: route.fare,
        isActive: route.isActive,
      });
      return;
    }
    this.stages.push(this.newStage());
    this.stages.push(this.newStage());
    this.form.reset({ name: '', routeNumber: '', fare: null, isActive: true });
  }

  private newStage(name = ''): FormControl<string> {
    return this.formBuilder.control(name, [
      Validators.required,
      Validators.pattern(/\S/),
      Validators.maxLength(100),
    ]);
  }
}
