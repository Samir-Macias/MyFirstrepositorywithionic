import { TestBed } from '@angular/core/testing';
import { Comments } from './comments.service';
import { describe, beforeEach, it, expect } from 'vitest';

describe('Comments', () => {
  let service: Comments;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Comments);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
