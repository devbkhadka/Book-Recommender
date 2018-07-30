import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BookRecommendationsComponent } from './book-recommendations.component';

describe('RecommendationsComponent', () => {
  let component: BookRecommendationsComponent;
  let fixture: ComponentFixture<BookRecommendationsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BookRecommendationsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BookRecommendationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
