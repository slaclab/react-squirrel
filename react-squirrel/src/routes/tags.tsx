import { createFileRoute } from '@tanstack/react-router';
import { TagPage } from '../pages';

// Sample tag groups data
const sampleTagGroups = [
  {
    id: '1',
    name: 'Subsystem',
    description: 'System subsystem classification',
    tags: ['Beam', 'Vacuum', 'RF', 'Magnet', 'Diagnostics'],
  },
  {
    id: '2',
    name: 'Priority',
    description: 'Operational priority level',
    tags: ['Critical', 'High', 'Medium', 'Low'],
  },
  {
    id: '3',
    name: 'Location',
    description: 'Physical location in facility',
    tags: ['Building 1', 'Building 2', 'Tunnel', 'Control Room'],
  },
];

export const Route = createFileRoute('/tags')({
  component: Tags,
});

function Tags() {
  const handleAddGroup = (name: string, description: string) => {
    console.log('Add group:', name, description);
    alert(`Add group "${name}" functionality would be implemented here`);
  };

  const handleEditGroup = (id: string, name: string, description: string, tags: string[]) => {
    console.log('Edit group:', id, name, description, tags);
    alert(`Edit group "${name}" functionality would be implemented here`);
  };

  const handleDeleteGroup = (id: string) => {
    console.log('Delete group:', id);
    alert(`Delete group functionality would be implemented here`);
  };

  return (
    <TagPage
      tagGroups={sampleTagGroups}
      isAdmin={true}
      onAddGroup={handleAddGroup}
      onEditGroup={handleEditGroup}
      onDeleteGroup={handleDeleteGroup}
    />
  );
}
