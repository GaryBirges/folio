import { Component, OnInit } from '@angular/core';
import { AuthenticationService } from '../services/authentication.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  email: string;
  password: string;
  errorMsg: string;
  data={email:'', pw:''}
  constructor(private auth: AuthenticationService, 
              private router: Router) { }

  signIn(){
    // console.log(this.email)
    // console.log(this.data)
    this.auth.login({email: this.data.email, password: this.data.pw})
    .then(resolve=>{
      this.router.navigate(['upload'])
    }).catch(error=>this.errorMsg=error.message)
  }
  ngOnInit() {
  }

}
