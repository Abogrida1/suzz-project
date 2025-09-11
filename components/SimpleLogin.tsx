export default function SimpleLogin() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f9fafb',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '400px',
        backgroundColor: 'white',
        padding: '32px',
        borderRadius: '8px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '64px',
            height: '64px',
            backgroundColor: '#dcfce7',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
          }}>
            🔒
          </div>
          <h1 style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#1f2937',
            marginBottom: '8px',
          }}>
            Admin Dashboard
          </h1>
          <p style={{ color: '#6b7280' }}>
            Healthy Food Delivery
          </p>
        </div>

        {/* Form */}
        <form style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Email */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '8px',
            }}>
              Email Address
            </label>
            <input
              type="email"
              defaultValue="admin@greebite.com"
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '16px',
                color: '#1f2937',
                fontFamily: 'Arial, sans-serif',
              }}
              placeholder="Enter your email"
            />
          </div>

          {/* Password */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '8px',
            }}>
              Password
            </label>
            <input
              type="password"
              defaultValue="123456789"
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '16px',
                color: '#1f2937',
                fontFamily: 'Arial, sans-serif',
              }}
              placeholder="Enter your password"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            style={{
              width: '100%',
              backgroundColor: '#2faf66',
              color: 'white',
              padding: '12px',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              fontFamily: 'Arial, sans-serif',
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1f8f4f'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#2faf66'}
          >
            Login to Dashboard
          </button>
        </form>

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <p style={{ fontSize: '12px', color: '#9ca3af' }}>
            Admin Access Only
          </p>
          <div style={{ 
            marginTop: '8px', 
            padding: '8px', 
            backgroundColor: '#f3f4f6', 
            borderRadius: '4px',
            fontSize: '12px',
            color: '#4b5563'
          }}>
            Test Login:<br/>
            Email: admin@greebite.com<br/>
            Password: 123456789
          </div>
        </div>
      </div>
    </div>
  )
}
