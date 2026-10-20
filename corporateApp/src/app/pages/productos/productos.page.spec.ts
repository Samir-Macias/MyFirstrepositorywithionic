import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { ProductsService } from '../../services/products';
import { ProductosPage } from './productos.page';

describe('ProductosPage', () => {
  let component: ProductosPage;
  let fixture: ComponentFixture<ProductosPage>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: ProductsService,
          useValue: { getProducts: vi.fn().mockResolvedValue([]) },
        },
      ],
    });
    fixture = TestBed.createComponent(ProductosPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
