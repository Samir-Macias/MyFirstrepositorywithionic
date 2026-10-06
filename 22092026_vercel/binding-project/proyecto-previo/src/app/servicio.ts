import { Service } from '@angular/core';
import { Usuario } from './usuario';

@Service()
export class Servicio {
    private users:Usuario[]=[
        {id:1, name:'Samir', email:'samir@gmail.com',active:true},
        {id:1, name:'Daniel', email:'daniel@gmail.com',active:true},
        {id:1, name:'Sonia', email:'sonia@gmail.com',active:true},
    ];

    async getUsuarios():Promise<Usuario[]>{
        return new Promise(resolve => {setTimeout(() => this.users),1000;});
    }

}
