const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

export const MOCK_USERS = [
  {
    username: 'admin',
    email: 'admin@speakvn.com',
    password: 'Password@1',
    role: 'admin',
    name: 'System Admin',
  },
  {
    username: 'teacher',
    email: 'teacher@gmail.com',
    password: 'Password@1',
    role: 'educator',
    name: 'Ms. Lan',
  },
  {
    username: 'player1',
    email: 'player@gmail.com',
    password: 'Password@1',
    role: 'user',
    name: 'Student Kha',
  },
]

export async function registerAPI(payload) {
  await delay(500)
  // Mock: không lưu thực tế, chỉ trả về lại payload kèm id giả lập
  return {
    id: Date.now().toString(),
    ...payload,
  }
}

export async function loginAPI(identifier, password) {
  await delay(500)

  const user = MOCK_USERS.find(
    (u) =>
      (u.username === identifier || u.email === identifier) &&
      u.password === password,
  )

  if (!user) {
    throw new Error('Invalid login credentials')
  }

  // Fake JWT token (header.payload.signature) để test flow attach Authorization + 401 handling
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const payload = btoa(
    JSON.stringify({
      sub: user.username,
      email: user.email,
      role: user.role,
      name: user.name,
      userId: user.username,
      iat: Math.floor(Date.now() / 1000),
    }),
  )
  const signature = 'mocksignature'
  const token = `${header}.${payload}.${signature}`
  const { password: _password, ...safeUser } = user

  return {
    token,
    user: safeUser,
  }
}

