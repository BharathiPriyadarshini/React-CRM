import React ,{ useState, useEffect } from "react";
import "./App.css";

const API_URL="http://localhost:3001";



function LoginPage({
  email,
  password,
  setEmail,
  setPassword,
  setToken,
  setRole,
}: any) {
  const [error, setError] = useState("");

    // Implement login form and authentication
  const handleLogin = async (e : React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    try{
      const res = await fetch(`${API_URL}/api/login`,{
        method : "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({email,password}),
      });
      
      const data = await res.json();
      if ( !res.ok) throw new Error(data.message || " Login Failed");

      localStorage.setItem("token",data.token);
      localStorage.setItem("role",data.user.role);
      setToken(data.token);
      setRole(data.user.role);
    }catch (err: any) {
      setError(err.message);
    }
    };

    return(
      <div className= "login-container">
        <form onSubmit={handleLogin} className="card">
        <h2>Login</h2>
        <input
          type="email" 
          placeholder= "Email"
          required
          value={email} 
          onChange={(e) => setEmail(e.target.value)}/>
        
        <input 
          type= "password" 
          placeholder="Password"
          required
          value={password} 
          onChange={(e)=>setPassword(e.target.value)}/>
        
        <button type="submit">Login</button>
        {error && <p className="error">{error}</p>}
        </form>
      </div>
    );
  };
  // Implement user form for add/edit
function UserForm({ user, token, onSave, onCancel }: any) {
  const [name, setName] = useState(user?.name || "");
  const [uEmail, setUEmail] = useState(user?.email || "");
  const [role, setRole] = useState(user?.role || "user");
  const [formError, setFormError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if(!name || !uEmail){
      setFormError("please fill in all fields");
      return;
    }

    const method = user ? "PUT" : "POST";
    const url = user
      ? `${API_URL}/api/users/${user.id}`
      : `${API_URL}/api/users`;

    const res = await fetch(url, {
      method,
        headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name, email: uEmail , role }),
    });

    if (res.ok)onSave();
    else setFormError("Failed to save user");
  };

  return (
    <form onSubmit={handleSubmit} className="card form-modal">
      <h3>{user ? "Edit User" : "Add New User"}</h3>
      {formError && <p className="error">{formError}</p>}
      <input 
        placeholder="Name" 
        value={name} 
        onChange={(e) => setName(e.target.value)} />
        
      <input 
        type="email"
        placeholder="Email" 
        required
        value={uEmail} 
        onChange={(e) => setUEmail(e.target.value)} />
        

      <select aria-label=" User role" value={role} onChange={(e) => setRole(e.target.value)}>
        <option value="user">User</option>
        <option value="admin">Admin</option>
      </select>

      <div className="form-actions">
        <button type="submit" className="save-btn">
          Save
        </button>
        <button type="button" className="cancel-btn" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
// Implement user listing with add/edit/delete functionality
function UserList({ users, token, role, logout, fetchUsers }: any) {
  const [editingUser, setEditingUser] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const handleDelete = async (id: number) => {
    if (window.confirm("Delete this user?")) {
      await fetch(`${API_URL}/api/users/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchUsers();
    }
  };

  return (
    <div className="dashboard">
      <header className="header">
        <h2>User Management</h2>
        
        {role === "admin"&&(
          <button className="add-btn" onClick={() => { setEditingUser(null); setShowForm(true); }}>
            + Add User
          </button> 
        )
        }
      </header>

      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {users.map((u: any) => (
            <tr key={u.id}>
              <td>{u.id}</td>
              <td>{u.name}</td>
              <td>{u.email}</td>
              <td>
                <span className={`badge ${u.role}`}>{u.role}</span>
              </td>

              <td>
                {role === "admin" && (
                  <>
                    <button className="edit-btn" onClick={() => { setEditingUser(u);setShowForm(true);}}>Edit</button>

                    <button className="delete-btn" onClick={() => handleDelete(u.id)}>Delete</button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="logout-container">
        <button className="logout-btn" onClick={logout}>
          logout
        </button>
      </div>

      
      {showForm && role === "admin" && (
        <div className="modal">
          <UserForm
            user={editingUser}
            token={token}
            onSave={() => {
              setShowForm(false);
              fetchUsers();
            }}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}
    </div>
  );
}
function App() {
  const [users, setUsers] = useState<any[]>([]);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState(localStorage.getItem("role"));


  const fetchUsers = async () => {
    if (!token) return;
    const res = await fetch(`${API_URL}/api/users`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setUsers(await res.json());
  };

  useEffect(() => {
    fetchUsers();
  }, [token]);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    setToken(null);
    setRole(null);
  };

  return (
    <div className="App">
      {!token ? (
        <LoginPage
          email={email}
          password={password}
          setEmail={setEmail}
          setPassword={setPassword}
          setToken={setToken}
          setRole={setRole}
        />
      ) : (
        <UserList
          users={users}
          token={token}
          role={role}
          logout={logout}
          fetchUsers={fetchUsers}
        />
      )}
    </div>
  );
}

export default App;