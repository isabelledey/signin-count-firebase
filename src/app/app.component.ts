import { Component } from '@angular/core';
import {
  Firestore,
  doc,
  docData,
  DocumentData,
  FirestoreDataConverter,
  QueryDocumentSnapshot,
  FieldValue,
  runTransaction,
  updateDoc,
  setDoc,
  Transaction,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AngularFireAuth } from '@angular/fire/compat/auth';
export interface User {
  count: number;
  id: string;
}

export const yourCustomTypeConverter: FirestoreDataConverter<User> = {
  toFirestore(customType: User): DocumentData {
    // Convert customType a format that can be stored in Firestore
    return {
      count: customType.count,
      id: customType.id,
    };
  },
  fromFirestore(snapshot: QueryDocumentSnapshot): User {
    // Convert a Firestore doc snapshot to a customType object
    const data = snapshot.data();
    return {
      count: data['count'],
      id: snapshot.id,
    };
  },
};

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  title = 'firebase';
  user$?: Observable<User>;

  devices: Record<string, any> = {};
  deviceId: string | undefined;

  constructor(private firestore: Firestore, private afAuth: AngularFireAuth) {}

  signIn() {
    this.afAuth
      .signInAnonymously()
      .then((userCredential) => {
        this.deviceId = userCredential.user?.uid;
        this.user$ = docData(
          doc(this.firestore, `users/${this.deviceId}`).withConverter(
            yourCustomTypeConverter
          )
        );
        runTransaction(this.firestore, this.incrementCounter.bind(this));
        console.log('signed in successfully');
      })
      .catch((error) => {
        console.log(error);
      });
  }

  incrementCounter(transaction: Transaction) {
    // Get the document refs
    const docRef = doc(this.firestore, `users/${this.deviceId}`);

    // Get the current value of the field
    return transaction.get(docRef).then((doc) => {
      const currentValue = doc.get('count');
      const newValue = (currentValue ?? 0) + 1;

      // Set the new value of the field
      transaction.set(docRef, { count: newValue }, { merge: true });
    });
  }
}
