import Constants from "expo-constants";

//local
//const devServerUri = 'http://' + Constants.expoConfig?.hostUri?.split(':').shift() + ':5155';

//container
//const devServerUri = 'http://' + Constants.expoConfig?.hostUri?.split(':').shift() + ':3001';

//ngrok
 const devServerUri = 'https://unproctored-nonirrationally-golda.ngrok-free.dev';

export const API_BASE_URL = __DEV__ ? devServerUri : 'http://192.168.1.72:5155'; //todo replace with prod api url

export enum BookStatus {
  Available = 1,
  BeingShared = 2,
  Unavailable = 3
}

export enum ShareStatus {
  Requested = 1,
  Ready = 2,
  PickedUp = 3,
  Returned = 4,
  HomeSafe = 5,
  Declined = 6
}