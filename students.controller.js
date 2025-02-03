import crudMysql from '../utils/cruds/crudMysql.js';
import searchInTables from '../utils/searchInTables.js';
import jwt from 'jsonwebtoken';

const { sign, verify } = jwt;

/* ------------- FUNCTIONS ----------------*/

export default {
	/**
	 * @route POST /login
	 * @desc  To log in a registered user
	 * @access Public
	 */
	login: async (req, res) => {
		try {
			// Obtener los datos del cuerpo de la solicitud
			//KAN-33
			const { login, pass } = req.body

			// Verificar que no hayan campos en null
			if (!login) {
				return res.status(400).json({ message: 'Faltan datos obligatorios' })
			}

			/*
			Ticket de Jira: KAN-42 
			Nombre: Rafa 
			Fecha: 24/01/25
			Descripcion: Login adaptado a roles
			*/
			//Validamos si el usuario existe en las distintas tablas. Si no existe en ninguna, respuesta con error - KAN-42
			await searchInTables.testInTables(res, 'students', login, pass) &&
				await searchInTables.testInTables(res, 'professors', login, pass) &&
				await searchInTables.testInTables(res, 'staffs', login, pass) &&
				res.status(404).json({ error: 'El usuario no existe' });
		} catch (error) {
			console.error('Error al hacer login:', error)
			res.status(500).json({ message: 'Error al hacer login', error })
		}
	},

	//KAN-35
	allUsers: async (req, res) => {
		try {
			const value = ['students']
			const data = await crudMysql.getAlumns(value)
			console.log(data[0])

			const response = [
				data.map(res => {
					const custom_response = {
						id: res.id_student,
						dni: res.dni,
						phone: res.phone,
						full_name: (res.student_name + ' ' + res.student_lastnames),
						email: res.email
					}
					return custom_response
				})
			]
			console.log(response)
			res.status(201).json(response)
		} catch (error) {
			console.error('Error: ', error)
			res.status(500).json({ message: 'Error ', error })
		}
	},
	//KAN-28
	updatePass: async (req, res) => {
		try {
			//Recogemos los datos del request
			const { email } = req.body;

			// Validamos que el email no sea nulo.
			if (!email) {
				return res.status(400).json({ message: "El campo email es obligatorio" });
			}

			// Crear un arreglo con los valores para buscar el usuario.
			const values = ["students", "email", email];

			// Llamar a la función getAlumns para verificar si el usuario existe.
			const infoAlum = await crudMysql.getAlumn(values);

			// Si el usuario no existe, devolver un mensaje de error.
			if (infoAlum.length === 0) {
				return res.status(400).json({ message: "Usuario no encontrado" });
			}

			// Si el usuario EXISTE, se genera el token.
			sign({ email }, "secretkey", { expiresIn: "15m" }, (err, token) => {
				if (err) {
					return res
						.status(500)
						.json({ message: "Error al generar el token", error: err });
				}

				// Responder con el token
				return res.status(200).json({
					message:
						"Usuario encontrado. Aquí está el token para cambiar la contraseña.",
					token: `Bearer ${token}`,
				});
			});
		} catch (e) {
			console.log("Error en updatePass: ", e);
			res.status(500).json({ message: "Error en el servidor", error: e });
		}
	},

	/*
		Ticket de Jira: KAN-29 
		Nombre: Rafa 
		Fecha: 22/01/25
		Descripcion: Funcionalidad confirmar nuevo correo funcional
	*/
	confirmPass: async (req, res) => {

		try {

			verify(req.params.token, 'secretkey', (err, token) => {
				//Si hay un error repondemos con él
				if (err) {
					console.log("Error en validating token: ", err);
					return res
						.status(500)
						.json({ message: "Error al validar el token", error: err });
					//Si es verificado...
				} else {
					//Extraemos el email del payload
					const { email } = token;

					//Actualizamos la base de datos
					const values = ['students', 'pass', req.body.pass, 'email', email];
					crudMysql.updateAlumnValue(values);

					// Enviamos la respuesta exitosa

					console.log("Contraseña actualizada correctamente");
					return res.status(500).json({ message: 'Contraseña actualizada correctamente.' });
				}
			})
		} catch (e) {
			console.log("Error en updatePass: ", e);
			res.status(500).json({ message: "Error en el servidor", error: e });
		}

	}, //KAN-43
	//KAN-38
	dataUserLogin: async (req, res) => {

		try {
			const { email, rol } = req.body;

			//Nombre y Apellidos del usuario que ha hecho login
			const rolName = `${rol.slice(0, rol.length - 1)}_name`;
			const rolLastnames = `${rol.slice(0, rol.length - 1)}_lastnames`;

			// Crear un arreglo con los valores del cuerpo de la solicitud (query) - KAN-33
			//'SELECT * FROM ?? WHERE ?? = ? AND (?? = ? OR ?? = ?)'
			let values = [`${rol}`, 'isVisible', 1, 'email', email, 'dni', email];
			const user = await crudMysql.getAlumnByDniOrEmail(values);

			if (!user) {
				return res.sendStatus(401).json({ message: "Usuario no válido" })
			}

			let n = `${user[0][rolName]}`;
			let l = `${user[0][rolLastnames]}`

			const resp = {
				full_name: n + " " + l,
				address: user[0].address,
				phone: user[0].phone,
				email: user[0].email,
				dni: user[0].dni
			}

			return res.status(200).json(resp)
		} catch (error) {
			res.status(500).json({ message: "Error en el servidor", error });
		}
	},

	/*
		Ticket de Jira: KAN-30 
		Nombre: Natalia
		Fecha: 24/01/25
		Descripcion: Funcionalidad confirmar primer registro de usuario 
	*/
	confirmUser: async (req, res) => {
		try {
			const { info } = req.body;

			// Validamos que el email no sea nulo.
			if (!info) {
				return res.status(400).json({ message: "El campo email/DNI es obligatorio" });
			}

			let values = [];
			let updateValues = [];

			if (info.includes(".com")) {
				values = ['email', "isRegistered", 'students', 'email', info];
				updateValues = ['students', "isRegistered", true, 'email', info];
			} else {
				values = ['dni', "isRegistered", 'students', 'dni', info];
				updateValues = ['students', "isRegistered", true, 'dni', info];
			}

			const [result] = await crudMysql.setRegisteredUser(values);

			if (result.length > 0 && result[0].isRegistered === 0) {
				crudMysql.updateAlumnValue(updateValues);
				return res.status(200).json({ message: `${result[0].email} registrado con éxito!` });
			}
			return res.status(401).json({ message: `El email no está en la base de datos o ya se encuentra registrado` });
		} catch (err) {
			return res.status(500).json({ message: 'Error en el registro', err })
		}
	},

	/*
	Ticket de Jira: KAN - IMAGINARIO 
	Nombre: Rolando 
	Fecha: 03/02/25
	Descripcion: 
	 Un endpoint PATCH que actualice el nombre de un alumno, buscándolo por DNI
	*/
	updateName: async (req, res) => {
		try {
			const { dni, name } = req.body;// El body debe contener el dni y el nombre del alumno


			// Validamos que los campos no estén vacíos.
			if (!dni || !name) {// Si el DNI o el nombre está vacío, nos dará un mensaje de error.
				return res.status(400).json({ message: "Debes escribir tu nombre y DNI" });// Muestra un mensaje de error en la respuesta(Postman).
			}

			const values = ['students', 'student_name', name, 'dni', dni];// Creo un array con los valores a actualizar.
			const affectedRows = await crudMysql.updateAlumnValue(values);// En la constante result guardo el resultado de la actualización.

			if (affectedRows > 0) {// Si la fila que se ha actualizado es mayor a 0, mostrará un mensaje
				return res.status(200).json({ message: "Nombre del alumno actualizado correctamente." });// Muestra un mensaje de éxito en la respuesta(Postman).
			}

			return res.status(404).json({ message: "No se ha podido actualizar el nombre del alumno." });

		} catch (error) {// En caso de error, captura el error y muestra un mensaje de error.
			console.log("Error al actualizar el nombre del alumno: ", error); //Muestra el error en la consola.
			res.status(500).json({ message: "Error al actualizar el nombre del alumno", error });// Muestra un mensaje de error en la respuesta(Postman).
		}
	},

	/*
	Ticket de Jira: KAN - IMAGINARIO 
	Nombre: Rolando 
	Fecha: 03/02/25
	Descripcion: 
	 Un endpoint POST para insertar un profesor
	*/

	newTeacher: async (req, res) => {
		try {
			const { id, registered, name, surname, address, phone, email, dni, pass, visible } = req.body;// El body debe contener los datos del profesor.
			console.log(req.body);

			// Validamos que los campos no estén vacíos.
			if (!id || !registered || !name || !surname || !address || !phone || !email || !dni || !pass || !visible) {
				return res.status(400).json({ message: "Debes rellenar todos los campos" });//Muestra un mensaje de error en la respuesta(Postman).
			}

			//Creamos un array con los valores a insertar.
			const values = ['professors', registered, name, surname, address, phone, email, dni, pass,visible];
			const affectedRows = await crudMysql.createAlumn(values);// En la constante affectedRows guardamos el resultado de la inserción(datos del profesor)
			
			if (affectedRows > 0) {
				return res.status(200).json({ messag: "Profesor insertado correctamente" });// Mensaje que nos indica que el profesor se ha insertado correctamente
			}
			return res.status(404).json({ mesage: "No se ha podido insertar el profesor" });
		} catch (error) {
			console.log("Error al insertar el profesor", error);
			res.status(500).json({ message: "Error al insertar al profesor", error });
		}
	}
}