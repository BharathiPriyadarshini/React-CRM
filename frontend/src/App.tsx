import React, { useState, useEffect } from "react";
import "./App.css";

const API_URL = "http://localhost:3001";



// Implement user form for add/edit
function UserForm({ user, token, onSave, onCancel }: any) {
  const [name, setName] = useState(user?.name || "");
  const [uEmail, setUEmail] = useState(user?.email || "");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState(user?.role || "user");
  const [formError, setFormError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !uEmail) {
      setFormError("please fill in all fields");
      return;
    }

    const method = user ? "PUT" : "POST";
    const url = user
      ? `${API_URL}/api/users/${user.id}`
      : `${API_URL}/api/users`;

    const body: any = { name, email: uEmail, role };
    if (!user && password) {
      body.password = password;
    }

    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      onSave();
    } else {
      const data = await res.json();
      setFormError(data.message || "Failed to save user");
    }
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

      {!user && (
        <input
          type="password"
          placeholder="Password (default: password)"
          value={password}
          onChange={(e) => setPassword(e.target.value)} />
      )}

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

function ChangePasswordModal({ token, onCancel }: any) {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg("");
    setError("");

    try {
      const res = await fetch(`${API_URL}/api/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ oldPassword, newPassword })
      });

      const data = await res.json();
      if (res.ok) {
        setMsg("Password updated successfully");
        setTimeout(onCancel, 1500);
      } else {
        setError(data.message || "Failed to change password");
      }
    } catch (err) {
      setError("Network error");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card form-modal">
      <h3>Change Password</h3>
      {error && <p className="error">{error}</p>}
      {msg && <p style={{ color: 'green', textAlign: 'center' }}>{msg}</p>}

      <input
        type="password"
        placeholder="Old Password"
        required
        value={oldPassword}
        onChange={(e) => setOldPassword(e.target.value)} />

      <input
        type="password"
        placeholder="New Password"
        required
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)} />

      <div className="form-actions">
        <button type="submit" className="save-btn">Update</button>
        <button type="button" className="cancel-btn" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}

// Implement user listing with add/edit/delete functionality
function UserList({ users, token, role, logout, fetchUsers, username, totalPages, currentPage, setPage }: any) {
  const [editingUser, setEditingUser] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

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
        <div>
          <h2>User Management</h2>
          <p>Logged in as: <strong>{username}</strong></p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button className="change-pw-btn" onClick={() => setShowPasswordModal(true)}>
            Change Password
          </button>

          {role === "admin" && (
            <button className="add-btn" onClick={() => { setEditingUser(null); setShowForm(true); }}>
              + Add User
            </button>
          )
          }
        </div>
      </header>

      {showPasswordModal && (
        <div className="modal">
          <ChangePasswordModal
            token={token}
            onCancel={() => setShowPasswordModal(false)}
          />
        </div>
      )}

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
                    <button className="edit-btn" onClick={() => { setEditingUser(u); setShowForm(true); }}>Edit</button>

                    <button className="delete-btn" onClick={() => handleDelete(u.id)}>Delete</button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination Controls */}
      <div className="pagination" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px', margin: '20px 0' }}>
        <button
          disabled={currentPage <= 1}
          onClick={() => setPage(currentPage - 1)}
          style={{ padding: '8px 16px', cursor: currentPage <= 1 ? 'not-allowed' : 'pointer' }}
        >
          Previous
        </button>
        <span>Page {currentPage} of {totalPages}</span>
        <button
          disabled={currentPage >= totalPages}
          onClick={() => setPage(currentPage + 1)}
          style={{ padding: '8px 16px', cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer' }}
        >
          Next
        </button>
      </div>

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

// Wrapper for LoginPage to handle logic
function LoginWrapper({ onLogin }: any) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch(`${API_URL}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || " Login Failed");

      onLogin(data.token, data.user.role, data.user.name);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="login-container">
      <form onSubmit={handleLogin} className="card">
        <h2>Login</h2>
        <input
          type="email"
          placeholder="Email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)} />

        <input
          type="password"
          placeholder="Password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)} />

        <button type="submit">Login</button>
        {error && <p className="error">{error}</p>}
      </form>
    </div>
  );
}

function App() {
  const [users, setUsers] = useState<any[]>([]);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [role, setRole] = useState(localStorage.getItem("role"));
  const [username, setUsername] = useState(localStorage.getItem("username"));

  // Pagination State
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Need to update LoginPage to set username
  const handleSetUser = (token: string, role: string, name: string) => {
    localStorage.setItem("token", token);
    localStorage.setItem("role", role);
    localStorage.setItem("username", name);
    setToken(token);
    setRole(role);
    setUsername(name);
  }

  const fetchUsers = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/users?page=${page}&limit=10`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 401) {
        logout();
        return;
      }

      if (res.ok) {
        const data = await res.json();
        // Handle new paginated response OR old array response (backward compatibility)
        if (Array.isArray(data)) {
          setUsers(data);
        } else if (data.data && Array.isArray(data.data)) {
          setUsers(data.data);
          setTotalPages(data.totalPages);
        }
      }
    } catch (err) {
      console.error("Failed to fetch users", err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [token, page]); // Re-fetch when page changes

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("username");
    setToken(null);
    setRole(null);
    setUsername(null);
  };

  return (
    <div className="App">
      {!token ? (
        <LoginWrapper onLogin={handleSetUser} />
      ) : (
        <UserList
          users={users}
          token={token}
          role={role}
          username={username}
          logout={logout}
          fetchUsers={fetchUsers}
          totalPages={totalPages}
          currentPage={page}
          setPage={setPage}
        />
      )}
    </div>
  );
}

export default App;