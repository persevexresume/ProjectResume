import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useStore from '../store/useStore';
import MasterProfileOptions from '../components/MasterProfileOptions';
import ProfileDetailsView from '../components/ProfileDetailsView';

/**
 * MasterProfile Controller
 * Manages the flow between selecting a profile creation method (Upload/Manual)
 * and editing the profile details.
 */
export default function MasterProfile() {
    const navigate = useNavigate();
    const { user } = useStore();
    
    // step can be 'options' or 'details'
    const [step, setStep] = useState('options');
    const [profileData, setProfileData] = useState(null);
    const [source, setSource] = useState('manual');

    /**
     * Called when user selects an option in MasterProfileOptions
     * @param {string} selectedSource - 'upload' or 'create'
     * @param {Object} data - The extracted or empty profile data
     */
    const handleSelectOption = (selectedSource, data) => {
        setSource(selectedSource === 'upload' ? 'upload' : 'manual');
        setProfileData(data);
        setStep('details');
    };

    /**
     * Handles navigation back from the current step
     */
    const handleBack = () => {
        if (step === 'details') {
            setStep('options');
        } else {
            navigate('/student');
        }
    };

    /**
     * Called after a successful save in ProfileDetailsView
     */
    const handleSaveComplete = () => {
        // Redirect to student dashboard after successful save
        navigate('/student');
    };

    return (
        <div className="master-profile-container">
            {step === 'options' ? (
                <MasterProfileOptions 
                    user={user} 
                    onSelectOption={handleSelectOption} 
                />
            ) : (
                <ProfileDetailsView 
                    profileData={profileData}
                    source={source}
                    user={user}
                    onBack={handleBack}
                    onSave={handleSaveComplete}
                />
            )}
        </div>
    );
}
