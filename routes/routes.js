import { Router } from 'express';
import address from '../controllers/address.controllers.js';
import courses from '../controllers/courses.controllers.js';
import comms from '../controllers/comms.controllers.js';
import students from '../controllers/students.controller.js'
//Rafa - KAN 29 -20/01/2025
import token from '../utils/tokenUtils.js';

const router = Router();

// BBDD MongoDB
//Address
router.get('/trainingpro/v1/address/all-types-address', address.allTypesAddress)
router.get('/trainingpro/v1/address/all-towns', address.allTowns)
//Courses
router.get('/trainingpro/v1/courses/all-courses', courses.allCourses)
//Comms
router.get('/trainingpro/v1/comms/all-comms', comms.allComms)
router.post('/trainingpro/v1/comms/new-comm', comms.newComms)
//LOPD
router.get('/trainingpro/v1/generic/lopd', comms.lopd)

// BBDD MySQL

/*
Ticket de Jira: KAN-42 
Nombre: Rafa 
Fecha: 24/01/25
Descripcion: 
Login adaptador para diferentes roles
*/
router.post('/trainingpro/v1/user/login', students.login);
//KAN-35
router.get('/trainingpro/v1/user/all-users', students.allUsers);
//KAN-28
router.post('/trainingpro/v1/user/update-pass', students.updatePass);

/*
Ticket de Jira: KAN-29 
Nombre: Rafa 
Fecha: 22/01/25
Descripcion: 
Funcionalidad confirmar nuevo correo funcional
*/
router.post('/trainingpro/v1/user/confirm-pass/:token', students.confirmPass);

//KAN-43
//KAN-38
router.post('/trainingpro/v1/user/data-user-login', students.dataUserLogin);

/*
    Ticket de Jira: KAN-30 
    Nombre: Natalia 
    Fecha: 24/01/25
    Descripcion: Poner al usuario como registrado tras el primer acceso.
*/
router.post('/trainingpro/v1/user/confirm-user', students.confirmUser);

/*
Ticket de Jira: KAN - IMAGINARIO 
Nombre: Rolando 
Fecha: 03/02/25
Descripcion: 
 Un endpoint PATCH que actualice el nombre de un alumno, buscándolo por DNI
*/
router.patch('/trainingpro/v1/user/update-name', students.updateName);
/*
Ticket de Jira: KAN - IMAGINARIO 
Nombre: Rolando 
Fecha: 03/02/25
Descripcion: 
 Un endpoint POST para insertar un profesor
*/
router.post('/trainingpro/v1/user/new-teacher', students.newTeacher);
export { router };
