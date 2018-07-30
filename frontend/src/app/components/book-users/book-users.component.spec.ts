import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BookUsersComponent } from './book-users.component';

describe('UsersComponent', () => {
  let component: BookUsersComponent;
  let fixture: ComponentFixture<BookUsersComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BookUsersComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BookUsersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
