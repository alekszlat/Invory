import { requestLabels } from '../shared/labels.js';

import { allPages } from '../api/client.js';
import { assetsApi } from '../api/assets.js';
import { useApiQuery } from '../api/query.js';

import AssetDetails from '../features/assets/AssetDetails.jsx';
import AssetDialog from '../features/assets/AssetDialog.jsx';
import RegisterDialog from '../features/registers/RegisterDialog.jsx';
import { DecisionDialog, ObservationDialog } from '../features/requests/RequestDialogs.jsx';
import { InviteDialog, ScopeDialog, SubregisterDialog } from '../features/subregisters/SubregisterDialogs.jsx';

export default function AppDialogs({ dialog, setDialog, userId, register, managed, subregister, invitedScope, actions }) {
  const close = () => setDialog(null);

  // The details and edit dialogs share one query, so the edit form opens with the asset that the details dialog already loaded.
  const detail = ['details', 'editAsset'].includes(dialog?.type) ? dialog : null;
  const detailsQuery = useApiQuery(userId, 'asset-detail', { registerId: detail?.registerId, subregisterId: detail?.subregisterId, assetId: detail?.assetId },
    signal => assetsApi.get(detail.registerId, detail.assetId, { subregisterId: detail.subregisterId }, signal), Boolean(detail));
  const scopeAssets = useApiQuery(userId, 'scope-assets', managed?.id,
    signal => allPages((params, nextSignal) => assetsApi.list(managed.id, params, nextSignal), { includeArchived: true }, signal),
    Boolean(managed && dialog?.type === 'scope'));

  return <>
    {dialog?.type === 'register' && <RegisterDialog onClose={close} onSave={actions.saveRegister} />}
    {dialog?.type === 'editRegister' && register && <RegisterDialog register={register} onClose={close} onSave={actions.updateRegister} />}
    {dialog?.type === 'asset' && register && <AssetDialog registerName={register.name} onClose={close} onSave={values => actions.saveAsset(values)} />}
    {dialog?.type === 'editAsset' && register && detailsQuery.data && <AssetDialog registerName={register.name} asset={detailsQuery.data} onClose={close} onSave={values => actions.saveAsset(values, detailsQuery.data)} />}
    {dialog?.type === 'details' && detailsQuery.data && <AssetDetails asset={detailsQuery.data} onClose={close}
      onEdit={detail.canManage ? () => setDialog({ ...detail, type: 'editAsset' }) : undefined}
      onArchive={detail.canManage ? () => actions.archiveAsset(detail) : undefined} />}
    {dialog?.type === 'subregister' && managed && <SubregisterDialog onClose={close} onSave={actions.saveSubregister} />}
    {dialog?.type === 'editSubregister' && subregister && <SubregisterDialog subregister={subregister} onClose={close} onSave={actions.renameSubregister} />}
    {dialog?.type === 'scope' && subregister && scopeAssets.isPending && <div role="status">Зареждане на активи…</div>}
    {dialog?.type === 'scope' && subregister && scopeAssets.error && <p role="alert">{scopeAssets.error.message}</p>}
    {dialog?.type === 'scope' && subregister && scopeAssets.data && <ScopeDialog assets={scopeAssets.data} subregister={subregister} onClose={close} onSave={actions.saveScope} />}
    {dialog?.type === 'invite' && subregister && <InviteDialog userId={userId} registerId={managed.id} subregister={subregister} onClose={close} onChanged={actions.reloadData} />}
    {dialog?.type === 'observation' && invitedScope?.role === 'participant' && <ObservationDialog asset={dialog.asset} disposal={dialog.disposal} onClose={close} onSave={values => actions.observe(dialog.asset, values)} />}
    {dialog?.type === 'decision' && <DecisionDialog approve={dialog.status === 'approved'} description={requestLabels[dialog.request.kind]} onClose={close}
      onSave={values => actions.decide(dialog.request, dialog.status, values)} />}
  </>;
}
