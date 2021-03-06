import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
// import * as firebase from 'firebase/app';
// import  firebase from 'firebase/app';
import 'firebase/firestore';
import 'firebase/auth';
import 'firebase/storage';
import { User } from '../models/user.model';
import { Observable } from 'rxjs'


@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {

  private user: Observable<firebase.User>
  constructor(private afAuth: AngularFireAuth) {
    this.user= this.afAuth.authState
   }

   login(user:User) {
    return this.afAuth.auth.signInWithEmailAndPassword(user.email, user.password)
   }
   logout(){
     return this.afAuth.auth.signOut();
   }

   authUser(){
     return this.user;
   }
}
