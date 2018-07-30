import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MovieUsersComponent } from './movie-users.component';

describe('MovieUsersComponent', () => {
  let component: MovieUsersComponent;
  let fixture: ComponentFixture<MovieUsersComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MovieUsersComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MovieUsersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
