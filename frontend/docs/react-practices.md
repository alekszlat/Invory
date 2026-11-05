# React Practices and Technical Reference

**Baseline** · React 19.3 and React DOM for web applications. **Reviewed** · November 2026.

Start with the component model, rendering, and state. Use the later sections when choosing how to load data, structure a project, or ship it. The inventory examples use an Invory-style app with a React/Vite frontend and an ASP.NET Core API. Code excerpts illustrate individual patterns. Where they refer to application-specific components or functions, supply those from your project.

React's rules govern things like render purity and Hook calls. Browser behavior governs things like form submission and focus. Recommendations about folder structure, routing, caching, and deployment depend on your project and framework. For a precise signature or compatibility check, use the reference page for the installed version. In an npm project, `npm ls react react-dom` shows the installed packages and can expose duplicates. Keep React and React DOM on matching versions.

Official references · [Learn React](https://react.dev/learn) · [Rules of React](https://react.dev/reference/rules) · [React API reference](https://react.dev/reference/react) · [React versions](https://react.dev/versions) · [React 19.3 release](https://react.dev/blog/2026/09/09/react-19-3)

## Contents

- [1. Think in React](#1-think-in-react)
- [2. JSX and React elements](#2-jsx-and-react-elements)
- [3. Components, props, and composition](#3-components-props-and-composition)
- [4. Conditional rendering, lists, and identity](#4-conditional-rendering-lists-and-identity)
- [5. Rendering, reconciliation, and Strict Mode](#5-rendering-reconciliation-and-strict-mode)
- [6. Events and user intent](#6-events-and-user-intent)
- [7. State, updates, and the Rules of Hooks](#7-state-updates-and-the-rules-of-hooks)
- [8. Structure and share state deliberately](#8-structure-and-share-state-deliberately)
- [9. Forms and submissions](#9-forms-and-submissions)
- [10. Refs, imperative APIs, and portals](#10-refs-imperative-apis-and-portals)
- [11. Effects and synchronization](#11-effects-and-synchronization)
- [12. Custom Hooks and the built-in Hook map](#12-custom-hooks-and-the-built-in-hook-map)
- [13. Scheduling, loading boundaries, and transitions](#13-scheduling-loading-boundaries-and-transitions)
- [14. Errors, empty states, and recovery](#14-errors-empty-states-and-recovery)
- [15. Requests, caching, and mutations](#15-requests-caching-and-mutations)
- [16. React DOM rendering and hydration](#16-react-dom-rendering-and-hydration)
- [17. React Server Components and Server Functions](#17-react-server-components-and-server-functions)
- [18. Performance, React Compiler, and diagnostics](#18-performance-react-compiler-and-diagnostics)
- [19. TypeScript and project tooling](#19-typescript-and-project-tooling)
- [20. Accessibility in React applications](#20-accessibility-in-react-applications)
- [21. Testing, debugging, and observability](#21-testing-debugging-and-observability)
- [22. An application structure for React, Vite, and ASP.NET Core](#22-an-application-structure-for-react-vite-and-aspnet-core)
- [23. Security and deployment](#23-security-and-deployment)
- [24. Upgrade strategy and API compatibility](#24-upgrade-strategy-and-api-compatibility)
- [25. React API lookup](#25-react-api-lookup)
- [26. Review a feature from state to release](#26-review-a-feature-from-state-to-release)

## 1. Think in React

React is a library for describing user interfaces as trees of components. React DOM connects those descriptions to web pages. Routing, data caching, deployment, and authorization need separate decisions, often supplied by a framework or supporting libraries.

A component's current **props**, **state**, and **context** determine what it renders. Props arrive from its parent, state is information React remembers for that component instance, and context comes from a provider above it. A user interaction usually runs an event handler, which requests a state update. React calls the component again with the new values and updates the parts of the interface that changed.

For an inventory register, start with the information and interactions the screen needs.

1. Split the mockup into components with clear responsibilities, such as `RegisterPage`, `AssetFilters`, `AssetTable`, and `AssetRow`.
2. Build a static version from representative data. Pass the assets into the table as props.
3. Identify what changes. The search query can live in state. The list of matching assets can be calculated from the query and assets.
4. Put each state value in the closest common owner of the components that need it. If the filter controls and table both depend on the query, give the page ownership.
5. Pass values down and let children signal intent through callbacks. The filters can call `onQueryChange` and the owner decides how to update the query.

Keep render functions pure. Given the same inputs, they should produce the same UI description. Avoid mutations of props, state, module-level variables, and values already passed to JSX. A locally created array or object can be built up inside a render because other renders cannot observe it. Put work such as saving assets and starting timers in the interaction or synchronization that calls for it. Reading the current time or generating a random ID directly in a render produces a different result on each attempt. Create persistent values where the underlying event occurs, such as assigning a new asset its ID when it is created.

[Thinking in React](https://react.dev/learn/thinking-in-react) · [Rules of React](https://react.dev/reference/rules) · [Components and Hooks must be pure](https://react.dev/reference/rules/components-and-hooks-must-be-pure)

## 2. JSX and React elements

JSX extends JavaScript with markup syntax. A build transform translates `<AssetRow asset={asset} />` into a call that creates a **React element**, an immutable description of a component and its inputs. React later calls the component as needed. For a built-in tag such as `<tr>`, the browser's DOM element is created or updated during the commit.

- Use lowercase for built-in DOM tags and PascalCase for components you define. Use `<AssetRow />` in JSX and let React call it so it can manage component identity and state.
- Return one JSX expression. When several siblings need no wrapper element, use `<>...</>` to group them. Use the explicit `<Fragment>` form when supplying a key or, from React 19.3, a ref.
- Close all tags. In built-in elements use JSX names such as `className`, `htmlFor`, and `tabIndex`. Keep `aria-*` and `data-*` names hyphenated. The `style` prop accepts an object with names such as `backgroundColor`. Prefer stylesheets or reusable classes for ordinary visual rules.
- Use braces for a JavaScript expression, as in `disabled={isSaving}` or `{asset.name}`. Strings, numbers, elements, and arrays of renderable children can appear in JSX. A plain object needs to be turned into fields or text first.
- Use the semantic element that performs the action. A `<button>` gives users a keyboard-operable action and an accessible role. An `<a href="...">` represents navigation.
- Normal JSX text interpolation renders text. Raw HTML via `dangerouslySetInnerHTML` bypasses that protection. Use it only when the source has been handled by a suitable trusted HTML or sanitization pipeline. Validate user-controlled URLs separately.

The modern JSX transform can handle JSX without a default `React` import. Import named APIs that you call, such as `useState` or `Fragment`. In a React 19 migration, check that your build and test toolchains use the modern transform.

[Writing markup with JSX](https://react.dev/learn/writing-markup-with-jsx) · [JavaScript in JSX with curly braces](https://react.dev/learn/javascript-in-jsx-with-curly-braces) · [Common DOM components](https://react.dev/reference/react-dom/components/common) · [React 19 upgrade guide](https://react.dev/blog/2024/04/25/react-19-upgrade-guide)

## 3. Components, props, and composition

Prefer function components for new code. Define them at module scope so their type stays stable between renders. A component declared inside another component is recreated when the outer component renders, which can reset state and replace DOM nodes in its subtree.

Choose the public API from the parent's point of view. Domain props such as `asset`, `canEdit`, and `onOpenDetails` say what a component needs or offers. Prefer clear names over generic options and reserve prop spreading for places such as deliberate forwarding by a thin DOM wrapper. Destructuring defaults apply when a prop is missing or `undefined`. An explicit `null`, `false`, or `0` reaches the component as supplied.

Use composition when a layout knows where content belongs and callers know what to put there. `children` is the content nested inside the element. Named JSX props work well for additional slots.

```jsx
function RegisterPanel({ title, actions, children }) {
  return (
    <section>
      <header>
        <h2>{title}</h2>
        {actions}
      </header>
      {children}
    </section>
  )
}

function RegisterSummary({ register, onAddAsset }) {
  return (
    <RegisterPanel
      title={register.name}
      actions={<button type="button" onClick={onAddAsset}>Add asset</button>}
    >
      <p>{register.assetCount} assets</p>
    </RegisterPanel>
  )
}
```

Some components manage a value locally and others let their caller control it. An expandable panel might expose `defaultExpanded` for initial local state, or `expanded` and `onExpandedChange` for parent control. Document who owns the value and keep that ownership stable during a component instance's lifetime. The same component can have controlled props for one behavior and internal state for another.

For older code, class components still work. They read `this.props` and `this.state`, and `this.setState` shallow-merges an object update. A `useState` setter replaces its entire value. Move pure calculations into the function body, keep user-driven side effects in handlers, and group the mount, update, and unmount parts of each external connection in a single Effect with cleanup. Preserve error boundaries during migration. React's built-in custom boundary mechanism still uses class lifecycle methods, and frameworks or libraries often wrap it.

[Your first component](https://react.dev/learn/your-first-component) · [Passing props to a component](https://react.dev/learn/passing-props-to-a-component) · [Sharing state between components](https://react.dev/learn/sharing-state-between-components) · [Class component reference and migration examples](https://react.dev/reference/react/Component)

## 4. Conditional rendering, lists, and identity

Use an early return for a whole-screen branch such as an empty register, a ternary for two short alternatives, and a boolean `&&` for optional content. With a numeric expression, `assetCount && <AssetTable />` produces visible `0` when the count is zero. Write `assetCount > 0 && <AssetTable />`. A component can return `null` to render no output. If its parent still renders the same component instance, that instance can keep its state. Removing it from the parent's tree also removes the state associated with it.

Use `filter` and `map` for ordinary collections. Give the outermost element returned by `map` a stable key that is unique among its siblings. For an asset row, use the asset's stored ID. A key marks item identity across inserts, removals, and reordering, so React can keep each remaining row's state and input values attached to the right item.

```jsx
function AssetList({ assets, query, onOpenAsset }) {
  const normalizedQuery = query.trim().toLowerCase()
  const matches = assets.filter(asset =>
    asset.name.toLowerCase().includes(normalizedQuery),
  )

  if (matches.length === 0) return <p>No matching assets.</p>

  return (
    <ul>
      {matches.map(asset => (
        <li key={asset.id}>
          <button type="button" onClick={() => onOpenAsset(asset.id)}>
            {asset.name}
          </button>
        </li>
      ))}
    </ul>
  )
}
```

- Generate client-side IDs once when creating a record and keep them with the record. Fresh random keys on each render cause remounts, which can erase drafts, reset focus, or rerun setup work.
- An array index is suitable when item positions are permanent and there is no separate item identity to preserve. Sorting, filtering, inserting, and deleting make the index unsafe for ordinary data rows.
- React consumes `key` itself. Pass `assetId` separately when the child needs to read the ID.
- To return multiple nodes per record without a wrapper, use `<Fragment key={asset.id}>`. The shorthand cannot take attributes.
- Use `<AssetEditor key={asset.id} asset={asset} />` when switching records should reset the whole editor, including child state and Effects. If drafts should survive switching, store them by asset ID in an owner that stays mounted.

[Conditional rendering](https://react.dev/learn/conditional-rendering) · [Rendering lists](https://react.dev/learn/rendering-lists) · [Preserving and resetting state](https://react.dev/learn/preserving-and-resetting-state) · [Fragment](https://react.dev/reference/react/Fragment)

## 5. Rendering, reconciliation, and Strict Mode

| Stage | What React or the browser does |
| --- | --- |
| Trigger | The root starts rendering, an update is scheduled, or a subscribed value changes. An ancestor rendering can also cause React to evaluate its descendants. |
| Render | React calls the relevant components and computes the next UI description. It can repeat or abandon this work. |
| Reconcile | During render, React matches the next tree against the previous tree to determine which instances and host nodes can be kept and what needs to change. |
| Commit | React applies the relevant DOM changes and connects refs. Layout Effects run in this phase before repaint. |
| Paint and passive Effects | The browser paints. Ordinary Effects run after a commit, with paint timing depending in part on the update and whether it came from an interaction. |

A component can render again while React keeps the same DOM nodes and properties. When investigating slow behavior, distinguish component work, DOM updates, layout, and paint.

State is associated with a component's position and identity in its parent tree. The same type at the same effective position can retain its state across prop changes. A different type or key usually remounts the subtree. With keyed siblings, identity follows the key within that parent as the order changes. Moving a child to a different parent changes where React tracks it. Removing a component frees its state.

Use `<StrictMode>` at the app root during development. Its extra render calls reveal impurity, and extra setup and cleanup cycles for Effects and callback refs reveal missing cleanup. Event handlers are outside these extra render checks. With Strict Mode applied only below the root, React skips the initial extra Effect cycle that could otherwise run child Effects without their parent Effects. Keep Strict Mode enabled and make operations such as connecting, subscribing, and registering DOM nodes symmetrical with their cleanup.

[Render and commit](https://react.dev/learn/render-and-commit) · [Preserving and resetting state](https://react.dev/learn/preserving-and-resetting-state) · [Strict Mode](https://react.dev/reference/react/StrictMode) · [Effect timing](https://react.dev/reference/react/useEffect#caveats)

## 6. Events and user intent

Pass a function to event props, such as `onClick={handleSave}` or `onClick={() => onOpenAsset(asset.id)}`. An expression such as `onClick={handleSave()}` calls the function immediately during render. Name DOM handlers for the event and public component callbacks for the intent, such as `onRequestWriteOff`. This lets a component change the input mechanism without changing its API.

React event objects expose browser-style methods and properties. `target` identifies the originating element and `currentTarget` identifies the element with the active handler. Read the required values synchronously before an `await`, especially `currentTarget`, which is meaningful only during event dispatch.

- Events that propagate are captured from ancestors toward the target and then bubble toward ancestors. Use handlers such as `onClickCapture` for capture. React's `onScroll` is an exception and only works on the element it is attached to.
- `preventDefault()` cancels the browser action, such as navigation or a form reload. `stopPropagation()` prevents subsequent propagation through the tree. Use each for its own purpose.
- Prefer an explicit child callback over depending on an unrelated ancestor click when the action carries important context. Avoid nesting interactive elements, such as putting a button inside a link.
- Work that happens because a user took a specific action belongs in that handler or an Action. Send an approval request when the user submits it. When the user opens a register and the visible register should stay subscribed to live updates, use a connection tied to that register.
- Handle errors from async event callbacks in the request or handler and show the relevant status. Standard Error Boundaries catch rendering errors in their descendants and errors in supported React Actions. An ordinary rejected event-handler promise needs its own handling.

[Responding to events](https://react.dev/learn/responding-to-events) · [React event object](https://react.dev/reference/react-dom/components/common#react-event-object) · [Separating events from Effects](https://react.dev/learn/separating-events-from-effects) · [Error boundaries](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)

## 7. State, updates, and the Rules of Hooks

`const [value, setValue] = useState(initialValue)` gives the component its current value and a way to request a new value. Each render receives a snapshot. A handler, timer callback, or promise callback created by that render can still see the values from that snapshot later. The setter schedules an update while the current variable retains its snapshot. Its return value is `undefined`, so `await setValue(nextValue)` completes independently of any render.

If the next value depends on the previous value of the same state, pass a pure updater. React queues updaters and applies them in order. It commonly batches updates, so several requests can produce a single commit. Separate user interactions such as distinct clicks are handled separately.

```jsx
import { useState } from 'react'

function InventoryCount() {
  const [count, setCount] = useState(0)

  function handleAddPair() {
    setCount(current => current + 1)
    setCount(current => current + 1)
  }

  return (
    <button type="button" onClick={handleAddPair}>
      Counted {count}. Add two.
    </button>
  )
}
```

Here two calls to `setCount(count + 1)` would each request the same value from the handler's captured snapshot. The two updater calls each receive the result of the preceding update. If the operation is known to add two, one call with `current => current + 2` is simpler.

- Use a lazy initializer such as `useState(() => buildInitialFilters())` for an expensive initial calculation. Keep it pure. In development Strict Mode, React can call initializers and updaters twice to check purity.
- State arrays and objects should be treated as read-only snapshots. Replace the changed array or object and copy each nested level that changes. For example, `setAssets(current => current.map(asset => asset.id === id ? { ...asset, status: 'counted' } : asset))` preserves the references of unchanged rows.
- Mutating methods such as `push`, `splice`, `sort`, and `reverse` modify the original array. Use an immutable alternative or make a copy before sorting or reversing. A shallow spread of an array still shares the objects inside.
- If you pass the same value back, React can skip work based on `Object.is`. Mutating and setting the original reference can leave the screen stale. Replacing the reference also lets memoized code detect the change.
- If a callback needs the latest value to compute a state update, use an updater. If it needs to read current values for an external subscription, choose a correct resubscription or Effect Event as described in section 11. A closure deliberately capturing the selection at click time is useful when a delayed action should affect that original selection.

Call Hooks at the top level of a function component or custom Hook, before early returns. Keep their order stable across renders. Move a condition inside the Hook's logic or extract a separate component that can mount conditionally. Never call Hooks from event handlers, class methods, plain helpers, loops, or callbacks passed to other Hooks. Enable the official Hooks linter so these mistakes and missing Effect dependencies are caught early.

`use(resource)` has a specific exception to the ordering rule. It can appear in loops or conditionals within a component or Hook, but must remain outside `try`/`catch`. For promise reads, use Suspense for pending work and an Error Boundary for a rejection. Use a stable promise from the appropriate loader, framework, or cache.

[State as a snapshot](https://react.dev/learn/state-as-a-snapshot) · [Queueing state updates](https://react.dev/learn/queueing-a-series-of-state-updates) · [Updating objects](https://react.dev/learn/updating-objects-in-state) · [Updating arrays](https://react.dev/learn/updating-arrays-in-state) · [Rules of Hooks](https://react.dev/reference/rules/rules-of-hooks) · [Official Hooks linter](https://react.dev/reference/eslint-plugin-react-hooks) · [The use API](https://react.dev/reference/react/use)

## 8. Structure and share state deliberately

Give each fact one owner and store the smallest set of independent facts. If you already have `assets` and `selectedAssetId`, calculate the selected asset from them. Copying the whole record into another state variable can leave stale details after the list refreshes. Calculate visible rows, counts, formatted text, and simple validation directly from current data. Measure an expensive calculation before adding memoization.

Group values that always change together and represent mutually exclusive phases with a single status such as `'idle'`, `'saving'`, `'success'`, or `'error'`. Two booleans like `isSaving` and `isSaved` can both be true accidentally. Keep independent values separate. A prop can intentionally seed a draft, but a name such as `initialName` makes that policy explicit. Choose whether switching records resets the draft, preserves it by record ID, or asks the user to resolve changes.

| A value needs to live | Usual owner |
| --- | --- |
| In one component, such as a search draft or an expanded row | Local `useState`. |
| Across sibling components, such as filters and the table they control | Their closest common owner, passed down with callbacks. |
| In a reusable screen workflow with several related state transitions | A feature-level `useReducer`. |
| Across a feature subtree, such as the current register or editing permissions | A scoped context provider, often with state or a reducer behind it. |
| Across browser history, bookmarks, or shared links | The route or URL search parameters. |
| Across screens with caching, invalidation, and refresh for remote records | The framework's loader/cache or a server-state library. |
| In an existing external observable store | The store's React binding or `useSyncExternalStore`. |

### Reducers

A reducer is a pure function that takes the current state and an action and returns the next state. Give actions names that describe what happened, such as `assetSelected` or `editorClosed`. Dispatch actions from handlers, and keep requests, logging, random IDs, and other side effects outside the reducer. Pass any values the reducer needs in the action.

```jsx
import { useReducer } from 'react'

function editorReducer(state, action) {
  switch (action.type) {
    case 'assetSelected':
      return { selectedId: action.assetId, mode: 'view' }
    case 'editRequested':
      return state.selectedId === null ? state : { ...state, mode: 'edit' }
    case 'editorClosed':
      return { selectedId: null, mode: 'closed' }
    default:
      throw new Error(`Unknown editor action: ${action.type}`)
  }
}

function useAssetEditor() {
  return useReducer(editorReducer, { selectedId: null, mode: 'closed' })
}
```

Use a reducer when centralizing updates makes the workflow easier to read and test. A simple toggle or text input needs little more than `useState`. The optional third argument to `useReducer` is a pure initializer for cases where the starting value needs work.

### Context

Create the context at module scope and provide a value above its consumers. In React 19, write `<RegisterContext value={value}>`. React 18 uses `<RegisterContext.Provider value={value}>`. `useContext(RegisterContext)` reads the closest provider for that context. The `createContext` default applies only when there is no matching provider. A matching provider with `value={undefined}` supplies `undefined`.

Context transports a value and subscribes consumers to it. The actual value still comes from a state owner or another data source. Keep providers near the features they serve. A memoized child that reads a context still updates when that provider's value changes. Passing a fresh object every render can trigger these updates even when its fields are unchanged. If profiling shows a cost, stabilize the provider value or separate independent contexts. In a reducer-backed feature, separating state and dispatch lets dispatch-only consumers avoid updates caused by changes to the state context.

Use context for information many descendants need. For a short, clear path, explicit props or a composed `children` slot make dependencies easier to see. If a provider is mandatory, wrap the read in a named Hook that gives a clear error when the provider is missing. A permission value in context can drive the interface. Authorize the actual operation where the server processes it.

[Choosing the state structure](https://react.dev/learn/choosing-the-state-structure) · [Sharing state](https://react.dev/learn/sharing-state-between-components) · [Extracting state logic into a reducer](https://react.dev/learn/extracting-state-logic-into-a-reducer) · [Reducer and context](https://react.dev/learn/scaling-up-with-reducer-and-context) · [useContext](https://react.dev/reference/react/useContext) · [useReducer](https://react.dev/reference/react/useReducer)

## 9. Forms and submissions

### Who owns the field value

| Mode | React API | Useful when |
| --- | --- | --- |
| Controlled | `value` or `checked`, with a handler that updates the value synchronously | Other UI reacts to each change, a parent owns the draft, or the field needs a predictable programmatic reset. |
| Uncontrolled | `defaultValue` or `defaultChecked`, then read the DOM value on submit with `FormData` | The browser can handle editing and you mainly need values when the user submits. |

A controlled text input should always receive a string, such as `name ?? ''`, and a controlled checkbox always a boolean. Read a text field's `event.currentTarget.value` and a checkbox's `event.currentTarget.checked`. Switching between controlled and uncontrolled modes, or setting the controlled value asynchronously, can cause editing problems. Keep text input updates urgent and defer expensive downstream work if needed. For a number input, keep the raw edit as text until validation or submission so an empty field stays distinct from zero. For a controlled `<select multiple>`, store an array of selected values. File selections come from the browser's `files` property or the submitted form data.

Use `<form>`, labels, meaningful field names, and explicit button types. This preserves keyboard submission and makes `FormData` useful. Capture `new FormData(event.currentTarget)` during an `onSubmit` handler before awaiting any work. Only named successful controls are included in a native submission. For example, disabled controls and unchecked checkboxes are omitted. Use native constraints such as `required` and `minLength` when they fit. Keep authoritative validation and permission checks on the server and associate inline errors with fields using `aria-describedby` and `aria-invalid` when appropriate.

### Choosing a submit path

- A URL in the `action` attribute gives ordinary browser submission.
- An `onSubmit` handler works in client-rendered apps across modern React versions. Call `preventDefault()` to take over submission, then manage pending state, errors, and success in the handler or the request layer.
- A function passed to a form's `action` or a submitter's `formAction` in React 19 runs as an Action and receives `FormData`. React's function-action path uses POST semantics regardless of the supplied `method`. React resets uncontrolled fields after a successful Action. When an expected validation error is returned as a normal result and field values must survive, use controlled drafts or explicitly restore values according to the product's behavior.
- Use `useActionState` to return application state such as field errors from an Action. The Action receives the previous Action state before the payload. Use `useFormStatus` from a component rendered inside the form to show that form's pending state. If the component calls the Hook and returns the form itself, the form is below the Hook and its status is unavailable there.
- Distinguish expected validation outcomes from unexpected failures. Show expected errors beside the field or form and route unexpected Action failures through the app's error boundary and reporting policy. Pending UI can help prevent duplicate submits. The API should still handle retries and repeated requests according to the operation's semantics.

```jsx
import { useActionState, useId, useState } from 'react'

function AssetNameForm({ initialName, saveName }) {
  const nameId = useId()
  const [name, setName] = useState(initialName ?? '')
  const [result, submitName, pending] = useActionState(
    async (_previousResult, formData) => {
      const submittedName = String(formData.get('assetName') ?? '').trim()
      if (!submittedName) {
        return { status: 'invalid', message: 'Enter an asset name.' }
      }

      await saveName(submittedName)
      return { status: 'saved', message: 'Name saved.' }
    },
    { status: 'idle', message: '' },
  )
  const invalid = result.status === 'invalid'
  const messageId = `${nameId}-message`

  return (
    <form action={submitName}>
      <label htmlFor={nameId}>Asset name</label>
      <input
        id={nameId}
        name="assetName"
        value={name}
        onChange={event => setName(event.currentTarget.value)}
        readOnly={pending}
        required={!pending}
        aria-invalid={invalid}
        aria-describedby={messageId}
      />
      <button type="submit" disabled={pending}>
        {pending ? 'Saving…' : 'Save name'}
      </button>
      <p id={messageId} role="status">{result.message}</p>
    </form>
  )
}
```

Here `saveName` is supplied by the caller. The example leaves the submitted name in the editor and sends unexpected save failures to an enclosing Error Boundary. If saving can return expected API validation errors, convert those responses to the relevant Action result and display them where users can correct the input. Server Functions and progressive enhancement require a supporting framework and are covered with server rendering.

[Input](https://react.dev/reference/react-dom/components/input) · [Select](https://react.dev/reference/react-dom/components/select) · [Textarea](https://react.dev/reference/react-dom/components/textarea) · [Form Actions](https://react.dev/reference/react-dom/components/form) · [useActionState](https://react.dev/reference/react/useActionState) · [useFormStatus](https://react.dev/reference/react-dom/hooks/useFormStatus)

## 10. Refs, imperative APIs, and portals

Use a ref for a value that must survive renders and is only needed outside rendering. `useRef(initialValue)` returns the same object across renders. Assigning to `ref.current` updates that object without scheduling a render. Common uses include an input node, a timer handle, and an instance of a browser or third-party object. Store visible information in state. Read or write refs from handlers and Effects. The usual render-time exception is predictable lazy initialization of a ref that is still empty.

```jsx
import { useRef } from 'react'

function AssetSearch() {
  const inputRef = useRef(null)

  return (
    <>
      <label>
        Search assets
        <input ref={inputRef} type="search" />
      </label>
      <button type="button" onClick={() => inputRef.current?.focus()}>
        Focus search
      </button>
    </>
  )
}
```

React fills the ref when attaching the node during commit and clears it when that node is removed. Use refs for imperative actions such as focusing, scrolling, measuring, or controlling media. Render visible properties through React. Direct edits to React-managed children or properties can conflict with a later commit. When integrating an imperative widget, give it a dedicated container and manage its lifecycle through setup and cleanup.

- In React 19, function components can receive `ref` as a prop. A library that also supports React 18 can use `forwardRef` for that version. Expose a focused API such as `focus()` through `useImperativeHandle` when exposing the entire DOM node would couple callers to implementation details.
- Use a callback ref to attach or detach a node in a registry, such as a map of asset IDs to rows. React 19 lets the callback return a cleanup function. Keep setup and cleanup balanced, account for callback identity changes, and avoid an implicit return of an assignment where React expects a cleanup function or no return value.
- In React 19.3, `<Fragment ref={groupRef}>` provides a `FragmentInstance` for supported group operations without adding a wrapper element. It can, for example, focus the first focusable descendant or attach a listener to the group's first-level DOM children. Use the explicit `Fragment` tag for refs. Use CSS layout and ordinary DOM elements when the group needs a wrapper's own semantics or box.

`createPortal(children, target)` places DOM nodes under an existing target elsewhere in the document. The portaled elements remain children of the same React parent, so context is inherited and React events bubble through the React tree. A portal can place an overlay outside a clipped container. For a modal, use native dialog capabilities or a proven accessible dialog implementation to manage its name, focus entry and return, dismissal, and interaction with the background. Keep the target stable to preserve the subtree.

[useRef](https://react.dev/reference/react/useRef) · [DOM manipulation with refs](https://react.dev/learn/manipulating-the-dom-with-refs) · [Callback refs](https://react.dev/reference/react-dom/components/common#ref-callback) · [useImperativeHandle](https://react.dev/reference/react/useImperativeHandle) · [Fragment refs](https://react.dev/reference/react/Fragment) · [createPortal](https://react.dev/reference/react-dom/createPortal)

## 11. Effects and synchronization

Use `useEffect` when committed UI needs to connect to something outside React. For example, opening a register can start a live subscription to that register, and closing it should stop the subscription. Other examples include timers, browser listeners, and third-party widgets. Each Effect should manage one independent connection or synchronization process.

### Choose the place from the reason the work happens

| Reason | Where to put the work |
| --- | --- |
| The visible value follows from current props or state | Calculate it during render. For genuinely expensive work, measure before adding `useMemo`. |
| A person clicked, submitted, or confirmed an operation | Use the corresponding event handler or Action. |
| A committed component needs to keep an external system in sync | Use an Effect and return cleanup when the setup allocates a resource. |
| Rendered data is owned by an existing observable store or browser API | Subscribe through its React binding or `useSyncExternalStore` when it fits. |
| A page needs remote data with caching, deduplication, and navigation support | Use the route loader, server data facilities, or a query cache where available. |

Avoid Effects that copy props into state, keep redundant state up to date, chain several local state updates, or watch for a flag to run a user-initiated command. These patterns add extra renders and can introduce timing bugs. When a component needs a fresh draft for a new record, an intentional key or a documented draft store usually expresses the reset policy more directly.

### Setup, cleanup, and dependencies

`useEffect(setup, dependencies)` runs setup after a client commit. When a dependency changes, React runs the previous cleanup with its previous values, then runs the new setup with current values. React runs cleanup when the Effect is removed. A listener should be removed, a timer cleared, and a subscription closed using the resources captured by that setup.

- With no dependency argument, React runs the Effect after every committed render of the component. With `[]`, the Effect has no reactive dependencies and is tied to its mounting and cleanup. Development Strict Mode and remounts can still rerun it.
- With `[registerId, subscribeToRegister]`, React compares each dependency to its previous value using `Object.is`. Include the reactive values used by setup and cleanup, such as props, state, and variables declared in the component. Setters and dispatch functions have stable identities. Updating a ref is invisible to dependency tracking.
- If an object or function keeps changing identity, inspect what the Effect actually needs. Move a configuration object inside the Effect when it is only used there, move a truly constant value outside the component, or depend on the primitive fields that define the subscription. Use an updater when a subscription only needs the previous value to calculate the next one. Keep the dependency linter enabled.
- An infinite cycle usually means the Effect sets state and that state causes a dependency to change. Check whether the state belongs in render, whether setup creates a fresh dependency each time, or whether an external update is really needed.
- Give each async setup a way to stop applying results once it becomes stale. An `AbortController` can cancel a fetch, and a flag set during cleanup can guard async steps that cannot be cancelled. Handle real errors separately from cancellation. Keep the Effect setup synchronous so it can return cleanup immediately, and run the asynchronous work inside it.
- Use `useLayoutEffect` for a layout measurement or visual adjustment that must finish before the browser paints, such as positioning a tooltip based on its measured size. It blocks paint. `useEffect` is the default for subscriptions and external work without that visual timing requirement. `useInsertionEffect` is for CSS-in-JS library authors that need styles inserted before layout Effects. Keep its work independent of DOM mutation timing. Effects run on the client.

### Separate reactive setup from an external event

Suppose the active register ID controls which subscription is open. A notification preference should affect what happens when an update arrives without reconnecting the subscription. In React 19.2 and later, `useEffectEvent` can give the subscription callback the latest committed behavior.

```jsx
import { useEffect, useEffectEvent } from 'react'

function useRegisterUpdates(registerId, subscribeToRegister, onAssetChanged) {
  const onUpdate = useEffectEvent(onAssetChanged)

  useEffect(() => {
    return subscribeToRegister(registerId, change => onUpdate(change))
  }, [registerId, subscribeToRegister])
}
```

Here `subscribeToRegister(id, listener)` is supplied by the application and returns an unsubscribe function. The subscription still reacts to the ID and the subscription function. The nested listener calls the Effect Event from the Effect's logic. Declare it next to the Effect that uses it, keep it out of the dependency array, and keep it inside that component or Hook. Use ordinary reactive dependencies for values that genuinely change what the Effect synchronizes.

[Effect reference](https://react.dev/reference/react/useEffect) · [You might not need an Effect](https://react.dev/learn/you-might-not-need-an-effect) · [Lifecycle of reactive Effects](https://react.dev/learn/lifecycle-of-reactive-effects) · [Removing Effect dependencies](https://react.dev/learn/removing-effect-dependencies) · [useEffectEvent](https://react.dev/reference/react/useEffectEvent) · [useLayoutEffect](https://react.dev/reference/react/useLayoutEffect) · [useInsertionEffect](https://react.dev/reference/react/useInsertionEffect) · [React 19.2 release](https://react.dev/blog/2025/10/01/react-19-2)

## 12. Custom Hooks and the built-in Hook map

A custom Hook is a function whose name starts with `use` followed by a capital letter. It combines Hooks into a behavior that multiple components can use. Each call has its own local state and Effect lifecycle. Components share actual data only when their calls read the same context, store, or other shared source.

- Name the Hook for the problem it solves, such as `useRegisterUpdates` or `useReducedMotion`. A name like `useMount` hides what the effect synchronizes and can hide missing dependencies.
- Prefer a regular helper function for standalone calculations. A function named `filterAssets` can be called from an event, render, reducer, or test.
- Treat Hook inputs as read-only. Keep the public API small and include the states callers need to act on, such as loading and an expected error.
- Extract a Hook when it captures a clear behavior or gives an external system a single integration point. Test the resulting behavior through representative consumers. Keep shared state and shared logic conceptually separate.

For a JavaScript animation that needs the browser's reduced-motion setting, subscribe to it as an external value. CSS media queries are enough when the effect is entirely in CSS.

```jsx
import { useSyncExternalStore } from 'react'

const reducedMotionQuery = '(prefers-reduced-motion: reduce)'

function subscribe(onChange) {
  const media = window.matchMedia(reducedMotionQuery)
  media.addEventListener('change', onChange)
  return () => media.removeEventListener('change', onChange)
}

function getSnapshot() {
  return window.matchMedia(reducedMotionQuery).matches
}

function getServerSnapshot() {
  return true
}

export function useReducedMotion() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
```

The subscription function stays stable at module scope. The snapshot is a boolean, so an unchanged preference naturally returns the same value. An external store with object snapshots should cache its immutable snapshot until the store changes. `getServerSnapshot` supplies the server value and the initial hydration value, so those reads need to agree. Here they start conservatively with reduced motion and the client then reads the browser preference.

### Built-in Hooks by purpose

| Purpose | API | When to reach for it |
| --- | --- | --- |
| Local state | `useState` | Remember an input, selection, toggle, or other independent value. |
| State transitions | `useReducer` | Centralize several related update rules in a pure reducer. |
| Shared values | `useContext` | Read and subscribe to a provider's current value. |
| Mutable handle | `useRef` | Keep a DOM node or other value for use in event handlers or Effects. |
| Component ref API | `useImperativeHandle` | Expose a small set of imperative methods to a ref consumer. |
| External synchronization | `useEffect` | Set up and clean up a connection to a system outside React. |
| Before-paint work | `useLayoutEffect` | Measure or make a layout-dependent adjustment before repaint. |
| Style insertion | `useInsertionEffect` | Support CSS-in-JS infrastructure that needs styles before layout Effects. |
| Effect callback | `useEffectEvent` | Read the latest committed values when an event from an Effect occurs. |
| Cache a calculation | `useMemo` | Reuse a measured expensive result or provide an identity needed for an optimization. |
| Cache a function | `useCallback` | Preserve a callback's identity when a consumer benefits from it. |
| Deprioritize an update | `useTransition` | Mark an update as a Transition and expose its pending state. |
| Deprioritize a consumer | `useDeferredValue` | Keep urgent input responsive while a slower part of the interface catches up. |
| Action result | `useActionState` | Track an Action's returned state and whether it is pending. |
| Optimistic feedback | `useOptimistic` | Show an expected result temporarily while an Action settles. |
| Parent form status | `useFormStatus` from `react-dom` | Read pending submission status from a descendant of the form. |
| External observable state | `useSyncExternalStore` | Read a consistent snapshot and subscribe to changes outside React. |
| Related DOM IDs | `useId` | Associate labels, inputs, hints, and error text. Use data IDs for list keys. |
| Custom Hook diagnostics | `useDebugValue` | Add a useful label for a custom Hook in React DevTools. |

`use(resource)` is a separate React API for reading supported resources during render. Context and Promise reads are covered by its own reference. Check feature-specific release notes for additional resource types and for APIs marked Canary or Experimental.

[Reusing logic with custom Hooks](https://react.dev/learn/reusing-logic-with-custom-hooks) · [Built-in React Hooks](https://react.dev/reference/react/hooks) · [useFormStatus](https://react.dev/reference/react-dom/hooks/useFormStatus) · [useSyncExternalStore](https://react.dev/reference/react/useSyncExternalStore) · [useId](https://react.dev/reference/react/useId) · [use](https://react.dev/reference/react/use)

## 13. Scheduling, loading boundaries, and transitions

### Keep urgent input responsive

React can interrupt or restart a background render when a more urgent update arrives. It still commits a consistent result to the DOM. A transition changes the priority of eligible React updates. The callback itself runs immediately, so a large synchronous loop inside it still blocks the JavaScript thread. Move genuinely heavy computation to a better algorithm, the server, or a worker as appropriate.

| API | Use it when | What changes |
| --- | --- | --- |
| `useTransition()` | You control an update and need local pending feedback | Wrap the setter in `startTransition` and use `isPending` to describe the work |
| Standalone `startTransition(action)` | You control an update outside a component, or can manage pending feedback elsewhere | Marks the updates without adding a Hook |
| `useDeferredValue(value)` | An urgent value also drives an expensive or suspending subtree | That subtree can show the previous value while React prepares the next version |

Keep a controlled text input's own value update urgent. If a large result list lags behind typing, defer the value passed to the list. For an expensive non-suspending child, a memoized child (manually or by React Compiler) can skip work while its deferred props stay equal. Pass a primitive or an object whose identity is stable across unrelated renders. A new object every render can schedule extra background work. Deferral has no fixed delay and does not rate-limit requests. Use a debounce for a time-based delay, query cancellation for obsolete requests, or both when the network needs that behavior.

```jsx
import { memo, useDeferredValue, useState } from 'react';

const AssetResults = memo(function AssetResults({ assets, filter }) {
  const normalizedFilter = filter.trim().toLowerCase();
  const matches = assets.filter((asset) =>
    asset.name.toLowerCase().includes(normalizedFilter)
  );

  return (
    <ul>
      {matches.map((asset) => (
        <li key={asset.id}>{asset.name}</li>
      ))}
    </ul>
  );
});

export function AssetSearch({ assets }) {
  const [filter, setFilter] = useState('');
  const deferredFilter = useDeferredValue(filter);
  const isUpdating = filter !== deferredFilter;

  return (
    <>
      <label>
        Search assets
        <input
          type="search"
          value={filter}
          onChange={(event) => setFilter(event.currentTarget.value)}
        />
      </label>
      <div aria-busy={isUpdating}>
        <AssetResults assets={assets} filter={deferredFilter} />
      </div>
    </>
  );
}
```

A transition can include an asynchronous Action. For state setters after an `await`, the current API still requires another `startTransition(() => setValue(result))`. Scheduling does not determine the order in which HTTP requests finish. For repeated edits, enforce ordering, cancel superseded reads, or reconcile server versions according to the workflow.

[useTransition](https://react.dev/reference/react/useTransition) · [startTransition](https://react.dev/reference/react/startTransition) · [useDeferredValue](https://react.dev/reference/react/useDeferredValue)

### Put Suspense where a coherent region can wait

A `<Suspense fallback={...}>` boundary shows its fallback when a descendant suspends while rendering. Typical sources include a pending `lazy` module, `use` reading a promise supplied by a compatible framework or library, and framework-integrated data loading. An ordinary fetch started in an Effect or an event handler does not activate the boundary. Use the request's pending state in that case.

- Declare `lazy(() => import('./RegisterHistory.jsx'))` at module scope. The import resolves to a module whose default export is the component. React caches the import promise and its result. A rejected import is handled by the nearest error boundary. Retry may require the loader or page to recover instead of remounting the same lazy component.
- Put separate boundaries around regions that can appear independently. Use one boundary when the pieces should appear together. Leave persistent navigation, a page heading, and unaffected actions available.
- Use transitions or deferred values to preserve already revealed content when the next render suspends. Newly added boundaries can still show their own fallbacks. When navigating to a genuinely different entity, key the boundary or an ancestor to reset it and avoid showing the previous entity's content.
- A tree that suspends before its first successful mount is retried from scratch. If an already visible tree is hidden again by Suspense, React cleans up its layout Effects and runs them again on reveal.
- Read a stable, cached promise with `use(promise)` in a component. On an RSC server component, prefer `async`/`await` for its own data. A rejected promise read with `use` reaches an error boundary unless the promise itself handles rejection. When reading context, `use(SomeContext)` can be conditional. For both forms, call `use` from a component or custom Hook and keep it outside `try/catch`.

```jsx
import { lazy, Suspense } from 'react';

const RegisterHistory = lazy(() => import('./RegisterHistory.jsx'));

export function HistoryPanel({ registerId }) {
  return (
    <section aria-labelledby="history-heading">
      <h2 id="history-heading">Register history</h2>
      <Suspense
        key={registerId}
        fallback={<p role="status">Loading register history…</p>}
      >
        <RegisterHistory registerId={registerId} />
      </Suspense>
    </section>
  );
}
```

[Suspense](https://react.dev/reference/react/Suspense) · [lazy](https://react.dev/reference/react/lazy) · [use](https://react.dev/reference/react/use)

### Preserve hidden UI or animate a deliberate change

- React 19.2 introduced `<Activity mode="hidden">`. React hides its DOM, preserves UI state, cleans up Effects, and lets hidden children render at lower priority. Revealing it restores state and recreates Effects. Use it for content people are likely to revisit soon, such as a draft panel. Hidden DOM and state consume resources. Native DOM behavior such as audio playback can persist, so include explicit cleanup when needed.
- In React DOM 19.3, `<ViewTransition>` can animate a committed transition update, a Suspense reveal, or the deferred part of an update. Wrap the changing region and keep urgent input immediate. React supports enter, exit, update, and shared-element animations. Use `addTransitionType('next')` inside a transition when motion depends on the cause of the update. Keep motion short, honor `prefers-reduced-motion`, and keep the interface usable when the browser skips the animation.

[Activity](https://react.dev/reference/react/Activity) · [ViewTransition](https://react.dev/reference/react/ViewTransition) · [addTransitionType](https://react.dev/reference/react/addTransitionType) · [React 19.3](https://react.dev/blog/2026/09/09/react-19-3)

## 14. Errors, empty states, and recovery

Separate the ways a screen can fail. A missing result, an expired session, and a component crash need different responses.

| Situation | Handle it with |
| --- | --- |
| The first request is pending | A local loading state or a Suspense fallback |
| The user searches and gets zero results | A specific empty message and, when relevant, a clear-filter action |
| Existing data is refreshing | Keep useful data visible and show a subtle refresh indicator |
| The server rejects a form value | Field messages and a useful summary, with the draft preserved |
| A request fails or conflicts | An inline recovery action, refresh and reconciliation, or session recovery as appropriate |
| A subtree throws during rendering | An error boundary with a local fallback |
| An event handler or independent promise fails | Handle the error in that operation or with the request library's error flow |

React's built-in error-boundary mechanism uses a class with `static getDerivedStateFromError` to choose a fallback and optional `componentDidCatch` for reporting. A framework or library can supply an equivalent boundary component. Keep a broad fallback at the app or route level and isolate independently recoverable areas, such as a history panel. Keep the fallback small enough to remain reliable. Reset it deliberately after correcting the cause or switching to a different entity. For a request failure, make the retry fetch fresh data as well as clear the error.

Boundaries do not handle errors in their own rendering, regular event handlers, independent asynchronous callbacks, or ordinary server rendering. An error thrown inside a `useTransition` Action is an exception to the usual asynchronous rule and can go to an error boundary. During streaming SSR, React can render the closest Suspense fallback in the server output and retry the region in the browser. Treat server logs and client recovery as separate signals. Log a correlation ID and a component stack where appropriate, without including credentials or private payloads. Present a message the user can act on.

[Component error boundaries](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary) · [Suspense and server errors](https://react.dev/reference/react/Suspense#providing-a-fallback-for-server-errors-and-client-only-content) · [useTransition error handling](https://react.dev/reference/react/useTransition#displaying-an-error-to-users-with-an-error-boundary) · [createRoot options](https://react.dev/reference/react-dom/client/createRoot)

## 15. Requests, caching, and mutations

### Give each kind of data an owner

| Data | Typical owner | Example |
| --- | --- | --- |
| Temporary interaction state | Nearest component or common parent | Which row is expanded |
| Shareable navigation state | URL and router | Register ID, filter, page, and sort |
| Remote records | A route loader, framework cache, or query library | Assets and permissions returned by ASP.NET Core |
| A working copy of a record | Form state with an explicit save/cancel lifecycle | The asset name a user is editing |
| A cross-screen client preference | Context or an external store when needed | Preferred table density |

A server response is a snapshot. Avoid copying it into a global store and separately keeping a query cache in sync. Make an explicit copy for an editable draft and define what should happen if the authoritative value changes mid-edit. Choose a clear source of truth when combining router loaders with a query client. For example, a loader can seed or prefetch the same query used by the screen.

### Load independently, use a stable cache key, and cancel outdated reads

1. Start independent reads together. Keep requests sequential only when one genuinely needs the other's result.
2. Give each request a key that includes the inputs that change its response. For example, use `['assets', registerId, { page, filter, sort }]`. Scope private data to the current account or tenant and clear private data when the session changes. For SSR, isolate per-request query clients unless a cache is explicitly designed to share safe public data.
3. Pick a freshness window and a revalidation policy. A list of pending approvals may need fresher data than a list of asset categories. Libraries distinguish how long cached data is fresh from how long inactive data stays in memory. Read the defaults for focus, reconnect, and retry.
4. Check `response.ok` when using `fetch`. It resolves normally for HTTP statuses such as `404`. Parse according to the response contract, including an empty `204` response. Use an `AbortSignal` where possible and prevent stale completions from updating the current view. Cancellation of a client request cannot undo server work that has already happened.
5. If an Effect must fetch, have cleanup abort the old request or ignore its result, and handle abort without showing a failure message. For repeated route and screen reads, a loader or query library can provide deduplication, prefetching, caching, and integration with navigation.

This TanStack Query hook assumes an existing `QueryClientProvider`, a valid selected register ID, and an endpoint that returns a JSON page. The account key separates private cached records in the browser. The server still checks the signed-in user's access.

```jsx
import { useQuery } from '@tanstack/react-query';

export function useRegisterAssets(accountId, registerId, { page, filter }) {
  return useQuery({
    queryKey: ['assets', accountId, registerId, { page, filter }],
    queryFn: async ({ signal }) => {
      const search = new URLSearchParams({ page: String(page), filter });
      const path = `/api/registers/${encodeURIComponent(registerId)}/assets`;
      const response = await fetch(`${path}?${search}`, { signal });

      if (!response.ok) {
        throw new Error(`Could not load assets (HTTP ${response.status})`);
      }

      return response.json();
    },
  });
}
```

### Make writes safe to retry and reconcile

Trigger a mutation from a user event or Action. Track its pending state and give immediate feedback. On success, use the authoritative response to update affected caches or invalidate the relevant keys and refetch. For example, approving a write-off can affect the pending requests, asset list, selected asset, and register history.

The right update strategy depends on the consequences of a failed write.

- **Wait for confirmation** when the result depends on permissions, conflicting edits, or an irreversible operation. In an inventory system, a write-off should show an accurate pending state until the server confirms the decision.
- **Show an optimistic result** when rollback is understandable and low-cost. A draft display preference is easier to undo than an approval. Keep the old value or track individual pending changes, restore or reconcile on failure, and revalidate the authoritative data. If several mutations affect the same records, a single snapshot rollback can erase later optimistic work. Use per-mutation tracking, ordering, or a strategy that refetches and reconciles.
- **Handle duplicates and conflicts on the server.** A disabled button only reduces repeat clicks. For operations that might be submitted twice after a timeout, use an API-defined idempotency key when supported. For concurrent edits, use a record version or a conditional request such as `If-Match` with an ETag when the API supports it. After an ambiguous timeout, verify the recorded outcome before offering a blind repeat.

Distinguish React's `useOptimistic` for temporary UI during an Action, a query library's cache, the browser's HTTP cache, and an application/server cache. Each has a different lifetime and invalidation policy.

[Fetching data with Effects](https://react.dev/reference/react/useEffect#fetching-data-with-effects) · [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch) · [TanStack Query keys](https://tanstack.com/query/latest/docs/framework/react/guides/query-keys) · [Query defaults](https://tanstack.com/query/latest/docs/framework/react/guides/important-defaults) · [Invalidation](https://tanstack.com/query/latest/docs/framework/react/guides/query-invalidation) · [Optimistic updates](https://tanstack.com/query/latest/docs/framework/react/guides/optimistic-updates) · [useOptimistic](https://react.dev/reference/react/useOptimistic)

## 16. React DOM rendering and hydration

| Rendering mode | When initial HTML appears | Browser entry | Good fit |
| --- | --- | --- | --- |
| Client-side rendering (CSR) | The browser starts with a shell and builds the React UI | `createRoot(container).render(<App />)` | Authenticated dashboards and SPAs with a separate API |
| Request-time server rendering (SSR) | The server generates HTML for the current request | `hydrateRoot(container, <App />)` | Pages where initial HTML or request-specific rendering matters |
| Static prerendering | A build or publishing process generates HTML ahead of requests | Hydrate if the page needs React interactions | Documentation, marketing pages, and stable public content |
| Partial prerendering | A framework serves a prerendered shell and resumes postponed regions when needed | Framework-managed hydration | Mixed static and dynamic pages with supported framework tooling |

HTML generation and the decision to run code as a Server Component are separate choices. A traditional server-rendered React app can use SSR without React Server Components. A framework can combine Server Components, SSR, and client navigation.

### Keep the server output and first browser render aligned

Hydration attaches React to existing markup. Feed the server and the first client render the same initial data, component tree, and relevant configuration. Treat mismatches as bugs. Common causes include locale or time-zone differences, `Date.now()` and `Math.random()` in render, invalid HTML nesting, and branching on `window` during render. Serialize a safe initial snapshot or use an explicitly client-only region. If you have multiple roots that use `useId`, use distinct prefixes and pass each corresponding prefix on both sides. Use `suppressHydrationWarning` only for a known, unavoidable local mismatch. It works one level deep and is a warning escape hatch.

- Use `renderToPipeableStream` with Node.js streams and `renderToReadableStream` with Web Streams runtimes. Streaming can send the shell before suspended parts are ready and send those parts later. Verify that proxies or CDNs preserve streaming in production. Set response status and headers before the shell is sent.
- Use `prerenderToNodeStream` or `prerender` when generating static output and waiting for supported data dependencies. Frameworks can use the corresponding resume APIs for postponed work. `renderToString` is a legacy option without streaming or waiting for suspended content. `renderToStaticMarkup` produces non-interactive HTML that cannot hydrate.
- For a Client Component that has no useful server representation in React DOM 19.3, call `use(browser())` inside a `<Suspense>` boundary. Its fallback appears in SSR output and the component renders in the browser. Use normal matched server and client markup when you can provide it. A browser-only render opt-out does not make a module-level `window` access safe to evaluate on the server.
- Keep custom HTML serialization narrow. Use the framework's data serialization and CSP integration where available. Treat state sent inside HTML as public to the receiving browser and escape it for its actual HTML context. Attach root reporting callbacks where your framework supports them and investigate recoverable errors, especially hydration failures.
- Component-level `<title>`, `<meta>`, and certain `<link>` elements integrate with the document head. Use one authoritative title per page. React can coordinate managed stylesheets with a `precedence` prop so a boundary can wait for the styles it needs, up to a timeout. Ordinary images and fonts do not make a boundary wait by default. A React 19.3 View Transition can wait briefly for visible images and new fonts when animating a Suspense reveal.
- Resource hint APIs such as `preconnect`, `preload`, and `preloadModule` help with measured critical requests. `preinit` and `preinitModule` go further by loading and applying or evaluating supported resources. Coordinate them with framework asset handling and use them selectively.
- React 19 supports custom elements. On the client, matching element properties receive prop values as properties. Otherwise React uses attributes where applicable. Server HTML can represent supported primitive values, such as strings and numbers, as attributes. Verify that the custom element is registered when setting object-valued properties and test it with real browser hydration if you render on the server.

[React DOM client APIs](https://react.dev/reference/react-dom/client) · [hydrateRoot](https://react.dev/reference/react-dom/client/hydrateRoot) · [React DOM server APIs](https://react.dev/reference/react-dom/server) · [Static React DOM APIs](https://react.dev/reference/react-dom/static) · [browser](https://react.dev/reference/react-dom/browser) · [Suspense resource loading](https://react.dev/reference/react/Suspense#what-activates-a-suspense-boundary) · [React DOM components](https://react.dev/reference/react-dom/components) · [React DOM resource APIs](https://react.dev/reference/react-dom) · [Custom elements in React 19](https://react.dev/blog/2024/12/05/react-19#support-for-custom-elements)

## 17. React Server Components and Server Functions

### The module boundary determines where code can run

In a compatible framework, Server Components run at build time or on the server in the RSC environment. They can read server resources, and their component code does not need to be shipped to the browser. They produce a representation the framework can combine with Client Components and, when using SSR, with initial HTML.

- Add `'use client'` at the module boundary that needs state, event handlers, Effects, or browser APIs. The module and its client-side dependency graph join the client bundle. Keep that boundary around interactive pieces and keep server-only imports out of them.
- A Client Component can still participate in generating initial HTML on the server. Put browser-only work in appropriate event handlers or Effects, or use your framework's client-only rendering mechanism. When a Server Component composes the tree, it can pass server-rendered content as `children` or another prop to a Client Component.
- Send only supported serializable values across the server/client boundary. That protocol supports more than JSON, but ordinary functions and arbitrary class instances cannot cross it. Send a minimal data projection. A Server Component's ability to read a secret does not make it appropriate to include that secret in a prop.
- React 19.3 supports importing a context from a `'use client'` module and rendering its provider directly in a Server Component. Context creation and client context consumption still belong on the client side of the RSC boundary.
- With RSC, `cache(fn)` can share work across Server Components during a server request. Create the cached function once at module scope, pass stable arguments, and handle failures. React clears that cache for each server request and can cache thrown errors for matching arguments. It has a different scope from a framework's persistent data cache. `cacheSignal()` gives supported asynchronous work an abort signal tied to the server render lifetime.

### A Server Function is a callable server entry point

In a compatible framework, `'use server'` marks an async Server Function. Calling its reference from client code makes a network request. A Server Function used as a form action or inside an Action is also called a Server Action. Forms wired through supported frameworks can use progressive enhancement before client JavaScript is ready.

Validate and authorize every server-side operation using the current identity and resource. Treat arguments, including hidden fields and bound IDs, as client-controlled input. Use the framework's loaders or Server Components for reads that benefit from parallelism and caching. When using Server Functions for writes, plan for field errors, revalidation, duplicates, and conflicts just as you would for an HTTP mutation.

Use an RSC-capable framework or build integration for these features. A typical Vite React SPA connected to ASP.NET Core uses regular client components and the ASP.NET API. A React client-side form Action can call that API without any RSC infrastructure. Follow the framework's supported React and server-package versions. The underlying bundler integration APIs have compatibility rules beyond those of the public component APIs. Check security advisories for the full framework and RSC dependency chain.

[Server Components](https://react.dev/reference/rsc/server-components) · [use client](https://react.dev/reference/rsc/use-client) · [use server](https://react.dev/reference/rsc/use-server) · [Server Functions](https://react.dev/reference/rsc/server-functions) · [cache](https://react.dev/reference/react/cache) · [cacheSignal](https://react.dev/reference/react/cacheSignal) · [React 19.3](https://react.dev/blog/2026/09/09/react-19-3) · [React RSC security advisories](https://react.dev/blog/2025/12/11/denial-of-service-and-source-code-exposure-in-react-server-components)

## 18. Performance, React Compiler, and diagnostics

### Measure the bottleneck before optimizing it

Reproduce a concrete interaction on a representative device and data set. Check the network waterfall, JavaScript execution, React render work, and browser layout and paint. A slow asset search can be caused by an API query, a long JavaScript task, or thousands of DOM rows. Each requires a different fix.

1. Start with fast paths that reduce work. Keep transient state near the affected components, remove unnecessary state updates and Effects, return smaller payloads, and paginate or virtualize long lists as needed. For virtualized tables, verify keyboard navigation, screen reader behavior, focus preservation, printing, and any browser find behavior your users expect.
2. Split large code paths with route-level loading or `lazy`. Prefetch likely next routes or data when the expected benefit justifies the extra bytes. Use stable list keys to preserve identity and avoid remounting rows on unrelated changes.
3. Use the React DevTools Profiler and browser Performance panel. `<Profiler onRender={...}>` reports commit-related measurements for its subtree, including render time spent on a committed update. React Performance tracks correlate React work with browser and network events in supported development or profiling builds. Measure ordinary production builds for user-facing performance and use profiling builds for diagnosis.
4. Compare the same scenario after a change. In production, collect aggregate user-facing performance metrics such as LCP, INP, and CLS and correlate problems with affected routes, devices, or releases.

### Memoization trades repeated work for bookkeeping

- `memo(Component)` can skip a render caused by unchanged props. React compares each prop with `Object.is` by default. The component can still render because its own state or consumed context changed. A new object, array, or function prop usually changes the comparison result.
- `useMemo(calculate, deps)` caches a calculation result. `useCallback(fn, deps)` caches a function reference. Use them for measured expensive calculations, a deliberately memoized child, or an integration that benefits from stable references. The calculation must be pure and correctness must survive a discarded cache.
- Prefer simple props, local state, and composition before custom comparisons. If a custom comparator is justified, compare every prop that affects behavior, including function props. Skipping a changed function can retain a stale closure.
- `flushSync` forces updates to flush synchronously for rare DOM integrations that must read the updated DOM before returning. It can run other pending work, reveal Suspense fallbacks, and harm responsiveness. Keep it at the integration boundary.

### Adopt the Compiler through the build, with a measured rollout

React Compiler is a build-time optimizer that can automatically memoize parts of a component or Hook. Installing React itself does not enable the compiler. Follow your toolchain's installation instructions, use the compiler-aware Hooks ESLint rules, and start with a measured feature or route if the existing app is large. Keep existing manual memoization during adoption until you can test the effect of removing it. Continue to follow the Rules of React. The compiler can skip code it cannot safely optimize, so address diagnostics systematically. Compiler directives such as `"use memo"` and `"use no memo"` control compilation in supported configurations and are distinct from RSC directives.

[Profiler](https://react.dev/reference/react/Profiler) · [React Performance tracks](https://react.dev/reference/dev-tools/react-performance-tracks) · [Web Vitals](https://web.dev/articles/vitals) · [memo](https://react.dev/reference/react/memo) · [useMemo](https://react.dev/reference/react/useMemo) · [useCallback](https://react.dev/reference/react/useCallback) · [flushSync](https://react.dev/reference/react-dom/flushSync) · [React Compiler](https://react.dev/learn/react-compiler/introduction) · [Incremental adoption](https://react.dev/learn/react-compiler/incremental-adoption)

## 19. TypeScript and project tooling

TypeScript checks your assumptions about props, state, and API shapes during development. It cannot validate an HTTP response at runtime. Start with strict type checking for a TypeScript codebase and narrow unknown input at its boundary.

- Use `.tsx` for TypeScript modules that contain JSX and align `@types/react` and `@types/react-dom` with the React major your project runs.
- Type a component's public props and infer straightforward local variables and return types. Use `ReactNode` for a slot that accepts renderable content. Use `ComponentProps<'button'>` or a related ref-aware utility for a component that intentionally exposes native button props. Require a meaningful accessible label for an icon-only button.
- Let JSX infer the event type inline. For a named handler that needs annotation, use a specific type such as `ChangeEvent<HTMLInputElement>`. Read `event.currentTarget` when you need the element the handler belongs to. Type DOM refs with a nullable initial value.
- Model mutually exclusive UI states with a discriminated union. Exhaustive handling is easier when each state carries only the values it needs. Type reducer actions the same way.
- Use an OpenAPI-generated client or types if that improves contract coordination. Validate values at trust boundaries, including cases where the API sends optional, nullable, or newly added fields. Keep DTO translation separate from reusable UI. Use decimal strings or an agreed exact numeric format for data that cannot safely round-trip through a JavaScript `number`.

```tsx
type Asset = { id: string; name: string };

type AssetsViewState =
  | { status: 'loading' }
  | { status: 'ready'; assets: Asset[] }
  | { status: 'error'; message: string };
```

Choose a React framework if it provides routing, data loading, and rendering capabilities you need. For a standalone SPA or a learning project, Vite can provide the build and dev server. Configure lint, formatting, and explicit type-check commands in CI. Vite transforms TypeScript for the browser but does not itself type-check the project. Run `tsc --noEmit` or `tsc -b` according to the project's TypeScript setup. Enable the recommended `eslint-plugin-react-hooks` rules, including `rules-of-hooks` and `exhaustive-deps`, and fix the structure behind diagnostics. Pin the project toolchain through a lockfile and a documented Node version compatible with the installed build tool. Use the same project scripts on Linux, Windows, and CI.

[React with TypeScript](https://react.dev/learn/typescript) · [TypeScript strict options](https://www.typescriptlang.org/tsconfig/#strict) · [ESLint plugin for React Hooks](https://react.dev/reference/eslint-plugin-react-hooks) · [Creating a React app](https://react.dev/learn/creating-a-react-app) · [Building from scratch](https://react.dev/learn/build-a-react-app-from-scratch) · [Vite features](https://vite.dev/guide/features) · [ASP.NET Core OpenAPI](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/openapi/overview)

## 20. Accessibility in React applications

React can render accessible HTML. The elements, behavior, content, and styling you choose determine whether people can use it. Use WCAG 2.2 as a web accessibility reference and test complete workflows.

- Use native buttons for actions, links with destinations for navigation, correctly nested headings, landmarks, labelled inputs, and table headers associated with data cells. Use a plain HTML table for tabular data unless you need the interactive keyboard model of an ARIA grid.
- Keep visible labels and meaningful accessible names. In JSX, use `htmlFor` for an explicit label association, and use `useId` if a reusable component needs a unique input, hint, or error association. Keep `aria-*` attributes hyphenated. Associate errors using `aria-invalid` and an appropriate description when the field has an actual validation error.
- Preserve visible focus. Keep tab order aligned with the meaningful DOM order. Handle focus when a route changes, when a dialog opens or closes, and when the focused item is removed. A modal needs an accessible name, focus management, a keyboard dismissal path, and inactive background content. A portal alone supplies none of that behavior.
- Announce meaningful dynamic status without stealing focus. Use a stable polite status region for messages like “Asset saved,” reserve assertive alerts for genuinely urgent messages, and avoid announcing every keystroke or background refresh.
- Keep error and success text distinguishable without relying on color. Test contrast, zoom, narrow windows, large text, reduced motion, keyboard-only operation, and at least one relevant screen reader/browser combination. Use an automated checker as an early signal and review interaction and announcement quality manually.

[React DOM common props](https://react.dev/reference/react-dom/components/common) · [useId](https://react.dev/reference/react/useId) · [WCAG 2.2](https://www.w3.org/TR/WCAG22/) · [WAI forms tutorial](https://www.w3.org/WAI/tutorials/forms/) · [WAI modal dialog pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)

## 21. Testing, debugging, and observability

| Layer | Test observable behavior | Useful tools |
| --- | --- | --- |
| Unit | Pure calculations, validation, reducers, formatters | A JavaScript test runner such as Vitest |
| Component or feature integration | The rendered form, keyboard interaction, request outcomes, loading and empty states | React Testing Library, user-event, and a network mock such as MSW |
| API contract | DTOs, error shapes, authorization, concurrency behavior | ASP.NET Core integration tests and OpenAPI checks |
| End-to-end | A browser, realistic routing, and a running app or test environment | Playwright or an equivalent browser runner |

Use role and accessible name queries when the user can identify a control that way. Use labels for form controls. Prefer awaiting meaningful UI changes over sleeping. In Testing Library, `getBy` expects a current match, `findBy` waits for one, and `queryBy` is useful when checking that an element is absent. Use `userEvent.setup()` and await interactions. Mock the network at its boundary to exercise real request and response handling. Keep routine tests independent of internal Hook state and implementation-specific markup.

Cover failure paths that would matter in production. For Invory, exercise a permission change while the page is open, validation that preserves a draft, a conflict between two editors, and a successful approval reflected in the list and history. Use isolated fixtures so a retry or parallel test does not inherit another test's records. For SSR apps, test real hydration and document navigation in a browser.

When a test library does not wrap updates for you, use `await act(async () => { ... })` from `react` around rendering or updates. React deprecated `react-test-renderer` and `react-dom/test-utils`'s `act` import. Migrate toward tests that run against the DOM. Use React DevTools for props and state, network tooling for request timing, and source maps and structured error reporting for deployed failures. Strip secrets and personal records from telemetry.

[Testing Library queries](https://testing-library.com/docs/queries/about/) · [user-event](https://testing-library.com/docs/user-event/intro/) · [MSW](https://mswjs.io/docs/) · [Playwright best practices](https://playwright.dev/docs/best-practices) · [React act](https://react.dev/reference/react/act) · [react-test-renderer deprecation](https://react.dev/warnings/react-test-renderer)

## 22. An application structure for React, Vite, and ASP.NET Core

For an authenticated inventory SPA, a practical split is React for interaction, Vite for the frontend toolchain, and ASP.NET Core for data, identity, authorization, and business rules. Use an application router for direct links and back/forward behavior. Let routes compose features and share the smallest set of reusable UI and infrastructure they need.

```text
src/
  app/                    # Startup, providers, router
  routes/                 # Page composition and route-level recovery
  features/
    registers/            # Register UI, queries, and types
    assets/               # Asset UI, requests, and form logic
    approvals/            # Approval actions and feedback
  shared/
    api/                  # HTTP client and normalized error handling
    ui/                   # Reusable controls with accessible defaults
```

Treat this layout as a starting point. A small feature can begin with a few colocated files. Promote code to `shared/` when multiple features need the same behavior. Keep API calls and DTO translation at a clear feature or infrastructure boundary. Use one browser router and one authoritative owner for each kind of state. Use Context for a scoped dependency or preference. Consider an external store when many unrelated components genuinely share client state or need subscription behavior. For a custom store, `useSyncExternalStore` provides React's supported subscription contract with stable snapshots, unsubscribe cleanup, and an optional matching server snapshot for SSR.

Agree on a shared API contract with the backend team. Include endpoint methods, names and shapes, pagination, authorization, time representation, and validation errors. An API can return a consistent Problem Details shape for errors, with stable codes or field details where needed. Keep server-driven authorization authoritative. For example, the approvals screen can hide or disable controls based on returned capabilities, while ASP.NET Core checks the actual register membership and action on every request.

During development, a relative path such as `/api/registers` can go through Vite's development proxy to the ASP.NET Core API. In production, configure a reverse proxy or host to route `/api/*` and serve the SPA, or use an explicit allowed API origin. The Vite development proxy only applies to the dev server. Use a known test account and seed data when checking that the Linux frontend and Windows backend agree on auth and response behavior.

[React setup options](https://react.dev/learn/creating-a-react-app) · [useSyncExternalStore](https://react.dev/reference/react/useSyncExternalStore) · [Vite proxy](https://vite.dev/config/server-options#server-proxy) · [ASP.NET Core OpenAPI](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/openapi/overview) · [ASP.NET Core API error handling](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/error-handling-api)

## 23. Security and deployment

### Keep trust decisions on the server

- Use TLS in production. Enforce resource-level authorization and input validation on every relevant endpoint. Return only data the current user may see, including in initial HTML, caches, and error messages.
- Choose authentication and credential storage with the backend. A same-origin cookie session or BFF can keep access tokens out of frontend JavaScript. Protect cookie-authenticated state-changing requests with the application's antiforgery controls and set secure cookie attributes. For bearer tokens, use a supported identity flow and have ASP.NET Core validate the signature, issuer, audience, and expiration. Keep session identifiers out of `localStorage` and `sessionStorage`.
- Treat CORS as a browser access policy. For cross-origin deployments, allow exact intended origins and configure credentials consistently on both sides if needed. Credentialed CORS cannot use a wildcard origin. Authentication and authorization remain necessary even with a restrictive CORS policy.
- Render untrusted strings as ordinary text. If a feature accepts HTML, use a reviewed sanitizer with a clear allowed set of markup before injecting the result. Review user-controlled URLs and permitted protocols separately. React 19.3 can pass browser Trusted Types through to supported DOM sinks. A restrictive Content Security Policy and a sound Trusted Types policy add protection alongside safe rendering and sanitization.
- Keep secrets on the server. Any value bundled into browser JavaScript is visible, including `VITE_*` variables. Those variables are appropriate for public configuration such as an API base URL. Avoid putting private records in shared caches, telemetry, or browser storage. Keep dependencies patched, including any React Server Components runtime packages used by your framework.

[ASP.NET Core JWT bearer validation](https://learn.microsoft.com/en-us/aspnet/core/security/authentication/configure-jwt-bearer-authentication) · [ASP.NET Core antiforgery](https://learn.microsoft.com/en-us/aspnet/core/security/anti-request-forgery) · [ASP.NET Core CORS](https://learn.microsoft.com/en-us/aspnet/core/security/cors) · [OWASP HTML5 security](https://cheatsheetseries.owasp.org/cheatsheets/HTML5_Security_Cheat_Sheet.html) · [OWASP XSS prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html) · [React 19.3 Trusted Types](https://react.dev/blog/2026/09/09/react-19-3#trusted-types-support) · [Vite environment variables](https://vite.dev/guide/env-and-mode)

### Make deployment and rollback predictable

1. Run the production build and deploy its output. For a static Vite SPA that is typically `dist/`. Use `vite preview` to check the build locally and a production static server, CDN, or application host to serve it.
2. Configure the public base path and router basename when deploying below a subpath. Serve the SPA entry document for client-side navigation paths. Keep API paths and missing static assets outside that fallback so they return their actual error responses.
3. Cache fingerprinted assets for a long time and give the entry document a revalidation policy that lets users receive new bundles. Keep previous assets available long enough for open sessions and rollbacks, or provide safe recovery for an outdated lazy chunk. Deploy the asset set before HTML that references it, or switch releases atomically.
4. Smoke-test a direct deep link, refresh, auth and sign-out, core forms, errors, and a role-restricted workflow in the deployed environment. Check the app with production base URLs, CSP, and cookies. For SSR, also verify streaming, hydration, per-request cache isolation, and server/client error reporting.

[Vite build](https://vite.dev/guide/build) · [Vite static deployment](https://vite.dev/guide/static-deploy) · [Vite SSR](https://vite.dev/guide/ssr) · [React streaming SSR](https://react.dev/reference/react-dom/server/renderToPipeableStream)

## 24. Upgrade strategy and API compatibility

Check the installed `react` and renderer versions, framework compatibility, and related types before adopting an API. Pin a tested dependency set in the lockfile. The React docs follow the current release. The React 19 upgrade guide recommends using React 18.3 as a warning-assisted intermediate step when migrating from React 18.

| Older usage or version boundary | Current practice |
| --- | --- |
| `ReactDOM.render`, `ReactDOM.hydrate`, `unmountComponentAtNode` | Use `createRoot`, `hydrateRoot`, and the root's `unmount()` |
| `findDOMNode` or legacy string refs | Use an explicit DOM ref |
| Function component `defaultProps` | Use parameter defaults. Class components still support `defaultProps` |
| `propTypes` checks on React components | Use TypeScript for static types and runtime validation at untrusted boundaries |
| `forwardRef` in new React 19-only function components | Accept `ref` as a prop. Keep compatibility wrappers where the supported React version requires them |
| `react-dom/test-utils`'s `act` or `react-test-renderer` | Import `act` from `react` and prefer DOM-based tests |
| React 19.0 through 19.3 feature availability | React 19 added Actions, `use`, and function-component refs as props. React 19.2 added `Activity` and `useEffectEvent`. React 19.3 stabilized `ViewTransition` and Fragment refs and introduced `browser()` in React DOM |

Keep the modern JSX transform enabled when upgrading to React 19. Use the official migration guides and available codemods as a starting point, review the generated changes, and test effect cleanup, refs, tests, and hydration after the update. Check the release channel on the reference page before using a Canary or experimental feature. Follow framework compatibility guidance and upgrade the packages that actually run server features together. React Compiler is a separate build-tool release with its own compatibility and rollout instructions.

[React versions](https://react.dev/versions) · [Versioning policy](https://react.dev/community/versioning-policy) · [React 19 upgrade guide](https://react.dev/blog/2024/04/25/react-19-upgrade-guide) · [React 19.2](https://react.dev/blog/2025/10/01/react-19-2) · [React 19.3](https://react.dev/blog/2026/09/09/react-19-3) · [React reference](https://react.dev/reference/react) · [React DOM reference](https://react.dev/reference/react-dom)

## 25. React API lookup

Use the official reference for signatures, argument constraints, supported environments, and release-specific details.

| Area | APIs and where to look |
| --- | --- |
| Built-in React components | `Fragment`, `StrictMode`, `Profiler`, `Suspense`, `Activity`, and `ViewTransition`. [Components](https://react.dev/reference/react/components) |
| Core APIs and interoperability | `use`, `createContext`, `lazy`, `memo`, `startTransition`, `addTransitionType`, and the development diagnostic `captureOwnerStack`. The legacy index covers `Children`, `cloneElement`, `createElement`, `isValidElement`, `Component`, `PureComponent`, `createRef`, and `forwardRef`. [React APIs](https://react.dev/reference/react/apis) · [Legacy APIs](https://react.dev/reference/react/legacy) |
| React Hooks | State, context, refs, effects, external stores, Actions, IDs, scheduling, and memoization. `use` is a separate API with its own call rules. [Hooks](https://react.dev/reference/react/hooks) · [`use`](https://react.dev/reference/react/use) |
| HTML and SVG in JSX | DOM props and event handlers, element-specific behavior for `input`, `select`, `textarea`, `form`, and `progress`, custom elements, and resource/document metadata elements such as `link`, `meta`, `script`, `style`, and `title`. [React DOM components](https://react.dev/reference/react-dom/components) · [Common props](https://react.dev/reference/react-dom/components/common) |
| Browser entry and integration | `createRoot`, `hydrateRoot`, `createPortal`, and `flushSync`. [Client entry](https://react.dev/reference/react-dom/client) · [DOM APIs](https://react.dev/reference/react-dom) |
| Resource hints | `prefetchDNS` resolves a host. `preconnect` starts a connection. `preload` and `preloadModule` fetch resources. `preinit` and `preinitModule` also make a supported resource active. Use them for resources likely to be needed soon and check the effect in the browser's network tools. [React DOM resource preloading](https://react.dev/reference/react-dom#resource-preloading-apis) |
| HTML on the server | Streaming, resuming a prerender, and legacy string rendering use the server entry point. Prerendering with Web or Node.js streams uses the static entry point. `browser` can mark a browser-only component during SSR in React 19.3. [Server entry](https://react.dev/reference/react-dom/server) · [Static entry](https://react.dev/reference/react-dom/static) · [`browser`](https://react.dev/reference/react-dom/browser) |
| Framework integration | Server Components, Server Functions, `cache`, `cacheSignal`, and the `'use client'` and `'use server'` directives. Frameworks define the build and routing integration. [React Server Components](https://react.dev/reference/rsc/server-components) · [Directives](https://react.dev/reference/rsc/directives) |
| Testing utilities | `act` from `react` helps flush updates triggered in a test. A testing library normally wraps its helpers for you. [`act`](https://react.dev/reference/react/act) |

### Interoperability details

- In React 19 and later, call `requestFormReset(form)` from `react-dom` inside an Action or transition to reset uncontrolled form fields. For controlled fields, update the state that supplies their values. [React 19 form Actions](https://react.dev/blog/2024/12/05/react-19#react-dom-form-actions)
- A React element is one kind of React node. JSX and `createElement` create elements. Numbers, strings, arrays of nodes, and portals can also render. `isValidElement` only recognizes elements. Accept `children` as renderable content unless you need an element-specific operation. For new component APIs, prefer named slots, render props, or explicit data over inspecting and cloning a caller's element tree.
- `createRoot` and `hydrateRoot` can report caught, uncaught, and recoverable errors with root options. Report them once at the appropriate layer. For a custom development overlay, `captureOwnerStack` can show which components created the elements in the current stack. Production reporting uses the error and available component stack.

[isValidElement](https://react.dev/reference/react/isValidElement) · [cloneElement alternatives](https://react.dev/reference/react/cloneElement#alternatives) · [createRoot](https://react.dev/reference/react-dom/client/createRoot) · [hydrateRoot](https://react.dev/reference/react-dom/client/hydrateRoot) · [captureOwnerStack](https://react.dev/reference/react/captureOwnerStack)

## 26. Review a feature from state to release

For an asset register, suppose users can search by name, open an asset, and change its location. Use that single workflow to review each decision.

| Decision | Example implementation | What to verify |
| --- | --- | --- |
| Data ownership | Keep the asset and its permissions on the server. Keep the draft location in the editor. Put a shareable search query in the URL. | Reloading restores the search. A link opens the same view. Closing the editor discards or preserves the draft according to the agreed behavior. |
| Render and identity | Derive the displayed rows from the query and loaded data. Use each asset ID as its row key. | Reordering rows preserves state on the same asset. Switching the editor to another ID handles the old draft deliberately. |
| Reads and races | Key the request or cache by register ID and filters. Cancel requests or ignore results that no longer match the active query. | Delay the first request and complete a newer one first. Only the matching response appears. |
| Writes and errors | Submit once per save attempt. Handle permission changes, conflicts, validation errors, and network failures as separate states. Reconcile with the server's saved record. | A rejected save leaves the draft available. Retrying a failed network request follows the API's duplicate-write rules. |
| Interaction | Use a labeled search field and real links or buttons. Show pending and error states near the action. | Use the full flow by keyboard. Check focus after opening, saving, and closing the editor. |
| Release | Run the production build and test the deployed route and API together. | Deep links load directly. A signed-out user sees the intended flow. Frontend settings contain only values safe to send to a browser. |
