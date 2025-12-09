# Dowrite

Dowrite is a modern, web-based creative writing application designed to help writers organize their manuscripts, settings, and research materials in one place. It features a seamless writing experience with auto-save capabilities and AI-powered assistance.

## Technical Architecture

### Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (Pages Router)
- **Frontend Library**: [React 18](https://react.dev/)
- **Database & Auth**: [Supabase](https://supabase.com/) (PostgreSQL)
- **Styling**: CSS Modules / Global CSS, Inline Styles (Component-level)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Notifications**: [Sonner](https://sonner.emilkowal.ski/)
- **AI Integration**: DeepSeek API (via Next.js API Routes)

### Project Structure

```
/
├── components/         # Reusable UI components
│   ├── Editor.jsx      # Core text editor with auto-save logic
│   ├── OutlineTree.jsx # Navigation for Chapters/Settings/Materials
│   ├── AIPanel.jsx     # AI assistant interface
│   └── ...
├── contexts/           # Global React Contexts
│   └── AuthContext.js  # User authentication state
├── lib/                # Utilities and Clients
│   └── supabaseClient.js # Supabase client configuration
├── pages/              # Next.js Routes
│   ├── index.js        # Main application controller (Dashboard)
│   ├── login.js        # Authentication page
│   ├── _app.js         # Global app wrapper (Providers, Toaster)
│   └── api/            # Server-side API routes
│       └── aiChat.js   # Proxy for DeepSeek AI API
└── styles/             # Global styles
```

### Data Flow & State Management

1.  **Authentication**: Managed via `AuthContext` using Supabase Auth. The app redirects to `/login` if no user session is found.
2.  **Main Application State (`pages/index.js`)**:
    - Fetches and holds state for `chapters`, `settings`, and `materials`.
    - Manages the currently active item and tab selection.
    - Handles CRUD operations (Create, Read, Update, Delete) interacting directly with Supabase.
3.  **Editor State (`components/Editor.jsx`)**:
    - Maintains local state for `title` and `content` for responsive typing.
    - Implements **Debounced Auto-Save** (2-second delay).
    - Triggers immediate save on **Component Unmount** or **Tab Switch** to prevent data loss.
    - Listens for `Ctrl+S` / `Cmd+S` for manual saving.
    - Uses Optimistic UI updates in `index.js` to provide instant feedback before server confirmation.

### Database Schema (Supabase)

The application uses a relational schema:

- **projects**: Stores user projects.
- **chapters**: Metadata for manuscript chapters (title, order, etc.).
- **chapter_content**: Separated content table for chapters to optimize loading (1:1 with chapters).
- **settings**: World-building entries (characters, locations).
- **materials**: Research materials and notes.

## Key Features

- **Multi-Tab Workspace**: Switch between Manuscript, Settings (World-building), and Materials (Research).
- **Smart Auto-Save**:
    - Saves automatically after inactivity.
    - Saves instantly when switching context.
    - Warns user before closing the tab if unsaved changes exist.
- **AI Assistant**: Integrated chat interface powered by DeepSeek for brainstorming and writing aid.
- **Responsive Design**: Mobile-friendly layout with collapsible sidebars.

## Development

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Environment Variables**:
    Create a `.env.local` file with:
    ```
    NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
    DEEPSEEK_API_KEY=your_deepseek_api_key
    ```

3.  **Run Development Server**:
    ```bash
    npm run dev
    ```

4.  **Open**: http://localhost:3000
