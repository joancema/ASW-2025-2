export class Task {
  constructor(
    public readonly id: number | null,
    public readonly title: string,
    public readonly description: string | null,
    public readonly isCompleted: boolean,
  ) {}
}
